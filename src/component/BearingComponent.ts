import {distinctUntilChanged, map} from "rxjs/operators";
import * as vd from "virtual-dom";

import {Observable, Subscription, combineLatest as observableCombineLatest} from "rxjs";

import {
    Component,
    ComponentService,
    IComponentConfiguration,
} from "../Component";
import {
    Spatial, Transform, Geo,
} from "../Geo";
import {Node} from "../Graph";
import {
    IVNodeHash,
    RenderCamera,
} from "../Render";
import {
    Container,
    Navigator,
} from "../Viewer";
import { IFrame } from "../state/interfaces/IFrame";
import ViewportCoords from "../geo/ViewportCoords";

export class BearingComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "bearing";

    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    private _svgNamespace: string;
    private _distinctThreshold: number;

    private _renderSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();
        this._viewportCoords = new ViewportCoords();

        this._svgNamespace = "http://www.w3.org/2000/svg";
        this._distinctThreshold = Math.PI / 360;
    }

    protected _activate(): void {
        let cameraBearingFov$: Observable<[number, number]> = this._container.renderService.renderCamera$.pipe(
            map(
                (rc: RenderCamera): [number, number] => {
                    let vFov: number = this._spatial.degToRad(rc.perspective.fov);
                    let hFov: number = rc.perspective.aspect === Number.POSITIVE_INFINITY ?
                        Math.PI :
                        Math.atan(rc.perspective.aspect * Math.tan(0.5 * vFov)) * 2;

                    return [this._spatial.azimuthalToBearing(rc.rotation.phi), hFov];
                }),
            distinctUntilChanged(
                (a1: [number, number], a2: [number, number]): boolean => {
                    return Math.abs(a2[0] - a1[0]) < this._distinctThreshold &&
                        Math.abs(a2[1] - a1[1]) < this._distinctThreshold;
                }));

        let nodeBearingFov$: Observable<[number, number]> = observableCombineLatest(
            this._navigator.stateService.currentState$.pipe(
                distinctUntilChanged(
                    undefined,
                    (frame: IFrame): string => {
                        return frame.state.currentNode.key;
                    })),
            this._container.renderService.bearing$).pipe(
                map(
                    ([frame, bearing]: [IFrame, number]): [number, number] => {
                        const node: Node = frame.state.currentNode;
                        const transform: Transform = frame.state.currentTransform;

                        const offset: number = this._spatial.degToRad(node.ca - bearing);

                        if (node.pano) {
                            let panoHFov: number = 2 * Math.PI * node.gpano.CroppedAreaImageWidthPixels / node.gpano.FullPanoWidthPixels;

                            return [offset, panoHFov];
                        }

                        const currentProjectedPoints: number[][] = this._computeProjectedPoints(transform);
                        const hFov: number = this._computeHorizontalFov(currentProjectedPoints) / 180 * Math.PI;

                        return [offset, hFov];
                    }),
                distinctUntilChanged(
                    (a1: [number, number], a2: [number, number]): boolean => {
                        return Math.abs(a2[0] - a1[0]) < this._distinctThreshold &&
                            Math.abs(a2[1] - a1[1]) < this._distinctThreshold;
                    }));

        this._renderSubscription = observableCombineLatest(
            cameraBearingFov$,
            nodeBearingFov$).pipe(
            map(
                ([[cb, cf], [no, nf]]: [[number, number], [number, number]] ): IVNodeHash => {
                    const background: vd.VNode = this._createBackground(cb);
                    const fovIndicator: vd.VNode = this._createFovIndicator(nf, no);
                    const north: vd.VNode = this._createNorth(cb);
                    const cameraSector: vd.VNode = this._createCircleSectorCompass(
                            this._createCircleSector(Math.max(Math.PI / 20, cf), "#FFF"));

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.BearingIndicatorContainer",
                            { oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); } },
                            [
                                background,
                                fovIndicator,
                                north,
                                cameraSector,
                            ]),
                    };
                }))
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _createFovIndicator(fov: number, offset: number): vd.VNode {
        const arc: vd.VNode = this._createFovArc(fov);

        const group: vd.VNode =
            vd.h(
                "g",
                {
                    attributes: { transform: "translate(19,19)" },
                    namespace: this._svgNamespace,
                },
                [arc]);

        const svg: vd.VNode =
            vd.h(
                "svg",
                {
                    attributes: { viewBox: "0 0 38 38" },
                    namespace: this._svgNamespace,
                    style: {
                        height: "38px",
                        left: "2px",
                        position: "absolute",
                        top: "2px",
                        transform: `rotateZ(${this._spatial.radToDeg(offset)}deg)`,
                        width: "38px",
                    },
                },
                [group]);

        return svg;
    }

    private _createFovArc(fov: number): vd.VNode {
        const radius: number = 17.75;
        const strokeWidth: number = 2.5;

        if (fov > 2 * Math.PI - Math.PI / 90) {
            return vd.h(
                "circle",
                {
                    attributes: {
                        cx: "0",
                        cy: "0",
                        "fill-opacity": "0",
                        r: `${radius}`,
                        stroke: "#FFF",
                        "stroke-width":
                        `${strokeWidth}`,
                    },
                    namespace: this._svgNamespace,
                },
                []);
        }

        let arcStart: number = -Math.PI / 2 - fov / 2;
        let arcEnd: number = arcStart + fov;

        let startX: number = radius * Math.cos(arcStart);
        let startY: number = radius * Math.sin(arcStart);

        let endX: number = radius * Math.cos(arcEnd);
        let endY: number = radius * Math.sin(arcEnd);

        let largeArc: number = fov >= Math.PI ? 1 : 0;

        let description: string = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;

        return vd.h(
            "path",
            {
                attributes: {
                    d: description,
                    "fill-opacity": "0",
                    stroke: "#FFF",
                    "stroke-width": `${strokeWidth}`,
                },
                namespace: this._svgNamespace,
            },
            []);
    }

    private _createCircleSectorCompass(cameraSector: vd.VNode): vd.VNode {
        let group: vd.VNode =
            vd.h(
                "g",
                {
                    attributes: { transform: "translate(1,1)" },
                    namespace: this._svgNamespace,
                },
                [cameraSector]);

        let svg: vd.VNode =
            vd.h(
                "svg",
                {
                    attributes: { viewBox: "0 0 2 2" },
                    namespace: this._svgNamespace,
                    style: {
                        height: "28px",
                        left: "7px",
                        position: "absolute",
                        top: "7px",
                        width: "28px",
                    },
                },
                [group]);

        return svg;
    }

    private _createCircleSector(fov: number, fill: string): vd.VNode {
        if (fov > 2 * Math.PI - Math.PI / 90) {
            return vd.h(
            "circle",
            {
                attributes: { cx: "0", cy: "0", fill: fill, r: "1" },
                namespace: this._svgNamespace,
            },
            []);
        }

        let arcStart: number = -Math.PI / 2 - fov / 2;
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

    private _createNorth(bearing: number): vd.VNode {
        const north: vd.VNode = vd.h("div.BearingNorth", []);
        const container: vd.VNode = vd.h(
            "div.BearingNorthContainer",
            { style: { transform: `rotateZ(${-bearing * 180 / Math.PI}deg)` } },
            [north]);

        return container;
    }

    private _createBackground(bearing: number): vd.VNode {
        return vd.h(
            "div.BearingIndicatorBackground",
            { style: { transform: `rotateZ(${-bearing * 180 / Math.PI}deg)` } },
            [
                vd.h("div.BearingIndicatorBackgroundCircle", []),
                vd.h(
                    "div.BearingIndicatorBackgroundArrowContainer",
                    [
                        vd.h("div.BearingIndicatorBackgroundArrow", []),
                    ]),
            ]);
    }

    private _computeProjectedPoints(transform: Transform): number[][] {
        const vertices: number[][] = [[1, 0]];
        const directions: number[][] = [[0, 0.5]];
        const pointsPerLine: number = 12;

        return Geo.computeProjectedPoints(transform, vertices, directions, pointsPerLine, this._viewportCoords);
    }

    private _computeHorizontalFov(projectedPoints: number[][]): number {
        const fovs: number[] = projectedPoints
            .map(
                (projectedPoint: number[]): number => {
                    return this._coordToFov(projectedPoint[0]);
                });

        const fov: number = Math.min(...fovs);

        return fov;
    }

    private _coordToFov(x: number): number {
        return 2 * Math.atan(x) * 180 / Math.PI;
    }
}

ComponentService.register(BearingComponent);
export default BearingComponent;
