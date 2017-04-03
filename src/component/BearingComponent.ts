/// <reference path="../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    Component,
    ComponentService,
    IComponentConfiguration,
} from "../Component";
import {
    Spatial,
    Transform,
} from "../Geo";
import {Node} from "../Graph";
import {
    IVNodeHash,
    RenderCamera,
} from "../Render";
import {IFrame} from "../State";
import {
    Container,
    Navigator,
} from "../Viewer";

export class BearingComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "bearing";

    private _spatial: Spatial;
    private _svgNamespace: string;
    private _distinctThreshold: number;

    private _renderSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();
        this._svgNamespace = "http://www.w3.org/2000/svg";
        this._distinctThreshold = Math.PI / 90;
    }

    protected _activate(): void {
        let nodeBearingFov$: Observable<[number, number]> = this._navigator.stateService.currentState$
            .distinctUntilChanged(
                undefined,
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                })
            .map(
                (frame: IFrame): [number, number] => {
                    let node: Node = frame.state.currentNode;
                    let transform: Transform = frame.state.currentTransform;

                    if (node.pano) {
                        let hFov: number = 2 * Math.PI * node.gpano.CroppedAreaImageWidthPixels / node.gpano.FullPanoWidthPixels;

                        return [this._spatial.degToRad(node.ca), hFov];
                    }

                    let size: number = Math.max(transform.basicWidth, transform.basicHeight);

                    if (size <= 0) {
                        console.warn(
                            `Original image size (${transform.basicWidth}, ${transform.basicHeight}) is invalid (${node.key}. ` +
                            "Not showing available fov.");
                    }

                    let hFov: number = size > 0 ?
                        2 * Math.atan(0.5 * transform.basicWidth / (size * transform.focal)) :
                        0;

                    return [this._spatial.degToRad(node.ca), hFov];
                })
            .distinctUntilChanged(
                (a1: [number, number], a2: [number, number]): boolean => {
                    return Math.abs(a2[0] - a1[0]) < this._distinctThreshold &&
                        Math.abs(a2[1] - a1[1]) < this._distinctThreshold;
                });

        let cameraBearingFov$: Observable<[number, number]> = this._container.renderService.renderCamera$
            .map(
                (rc: RenderCamera): [number, number] => {
                    let vFov: number = this._spatial.degToRad(rc.perspective.fov);
                    let hFov: number = rc.perspective.aspect === Number.POSITIVE_INFINITY ?
                        Math.PI :
                        Math.atan(rc.perspective.aspect * Math.tan(0.5 * vFov)) * 2;

                    return [this._spatial.azimuthalToBearing(rc.rotation.phi), hFov];
                })
            .distinctUntilChanged(
                (a1: [number, number], a2: [number, number]): boolean => {
                    return Math.abs(a2[0] - a1[0]) < this._distinctThreshold &&
                        Math.abs(a2[1] - a1[1]) < this._distinctThreshold;
                });

        this._renderSubscription = Observable
            .combineLatest(
                nodeBearingFov$,
                cameraBearingFov$)
            .map(
                (args: [[number, number], [number, number]]): IVNodeHash => {
                    let background: vd.VNode = vd.h(
                        "div.BearingIndicatorBackground",
                        { oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); } },
                        [
                            vd.h("div.BearingIndicatorBackgroundRectangle", {}, []),
                            vd.h("div.BearingIndicatorBackgroundCircle", {}, []),
                        ]);

                    let north: vd.VNode = vd.h("div.BearingIndicatorNorth", {}, []);

                    let nodeSector: vd.VNode = this._createCircleSector(args[0][0], args[0][1], "#000");
                    let cameraSector: vd.VNode = this._createCircleSector(args[1][0], args[1][1], "#fff");

                    let compass: vd.VNode = this._createCircleSectorCompass(nodeSector, cameraSector);

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.BearingIndicator",
                            {},
                            [
                                background,
                                north,
                                compass,
                            ]),
                    };
                })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _createCircleSectorCompass(nodeSector: vd.VNode, cameraSector: vd.VNode): vd.VNode {
        let group: vd.VNode =
            vd.h(
                "g",
                {
                    attributes: { transform: "translate(1,1)" },
                    namespace: this._svgNamespace,
                },
                [nodeSector, cameraSector]);

        let centerCircle: vd.VNode =
             vd.h(
                "circle",
                {
                    attributes: {
                        cx: "1",
                        cy: "1",
                        fill: "#abb1b9",
                        r: "0.291667",
                        stroke: "#000",
                        "stroke-width": "0.0833333",
                    },
                    namespace: this._svgNamespace,
                },
                []);

        let svg: vd.VNode =
            vd.h(
                "svg",
                {
                    attributes: { viewBox: "0 0 2 2" },
                    namespace: this._svgNamespace,
                    style: {
                        bottom: "4px",
                        height: "48px",
                        left: "4px",
                        position: "absolute",
                        width: "48px",
                    },
                },
                [group, centerCircle]);

        return svg;
    }

    private _createCircleSector(bearing: number, fov: number, fill: string): vd.VNode {
        if (fov > 2 * Math.PI - Math.PI / 90) {
            return vd.h(
            "circle",
            {
                attributes: { cx: "0", cy: "0", fill: fill, r: "1" },
                namespace: this._svgNamespace,
            },
            []);
        }

        let arcStart: number = bearing - fov / 2 - Math.PI / 2;
        let arcEnd: number = arcStart + fov;

        let startX: number = Math.cos(arcStart);
        let startY: number = Math.sin(arcStart);

        let endX: number = Math.cos(arcEnd);
        let endY: number = Math.sin(arcEnd);

        let largeArc: number = fov >= Math.PI ? 1 : 0;

        let description: string = `M 0 0 ${startX} ${startY} A 1 1 0 ${largeArc} 1 ${endX} ${endY}`;

        return vd.h(
            "path",
            {
                attributes: { d: description, fill: fill },
                namespace: this._svgNamespace,
            },
            []);
    }
}

ComponentService.register(BearingComponent);
export default BearingComponent;
