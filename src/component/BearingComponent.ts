import {distinctUntilChanged, map} from "rxjs/operators";
import * as vd from "virtual-dom";

import {Observable, Subscription, combineLatest as observableCombineLatest} from "rxjs";

import {
    Component,
    ComponentService,
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
import IBearingConfiguration from "./interfaces/IBearingConfiguration";
import ISize from "../render/interfaces/ISize";
import ComponentSize from "./utils/ComponentSize";

/**
 * @class BearingComponent
 *
 * @classdesc Component for indicating bearing and field of view.
 *
 * @example
 * ```
 * var viewer = new Mapillary.Viewer(
 *     "<element-id>",
 *     "<client-id>",
 *     "<my key>");
 *
 * var bearingComponent = viewer.getComponent("bearing");
 * bearingComponent.configure({ size: Mapillary.ComponentSize.Small });
 * ```
 */
export class BearingComponent extends Component<IBearingConfiguration> {
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
        const cameraBearingFov$: Observable<[number, number]> = this._container.renderService.renderCamera$.pipe(
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

        const nodeBearingFov$: Observable<[number, number, number]> = observableCombineLatest(
            this._navigator.stateService.currentState$.pipe(
                distinctUntilChanged(
                    undefined,
                    (frame: IFrame): string => {
                        return frame.state.currentNode.key;
                    })),
            this._container.renderService.bearing$,
            this._navigator.panService.panNodes$).pipe(
                map(
                    ([frame, bearing, panNodes]: [IFrame, number, [Node, Transform, number][]]): [number, number, number] => {
                        const node: Node = frame.state.currentNode;
                        const transform: Transform = frame.state.currentTransform;

                        const offset: number = this._spatial.degToRad(node.ca - bearing);

                        if (node.pano) {
                            let panoHFov: number = 2 * Math.PI * node.gpano.CroppedAreaImageWidthPixels / node.gpano.FullPanoWidthPixels;

                            return [offset, panoHFov / 2, panoHFov / 2];
                        }

                        const currentProjectedPoints: number[][] = this._computeProjectedPoints(transform);
                        const hFov: number = this._spatial.degToRad(this._computeHorizontalFov(currentProjectedPoints));

                        let hFovLeft: number = hFov / 2;
                        let hFovRight: number = hFov / 2;

                        for (const [n, , f] of panNodes) {
                            const diff: number = this._spatial.wrap(n.ca - node.ca, -180, 180);
                            if (diff < 0) {
                                hFovLeft = this._spatial.degToRad(Math.abs(diff)) + f / 2;
                            } else {
                                hFovRight = this._spatial.degToRad(Math.abs(diff)) + f / 2;
                            }
                        }

                        return [offset, hFovLeft, hFovRight];
                    }),
                distinctUntilChanged(
                    (
                        [offset1, hFovLeft1, hFovRight1]: [number, number, number],
                        [offset2, hFovLeft2, hFovRight2]: [number, number, number]): boolean => {

                        return Math.abs(offset2 - offset1) < this._distinctThreshold &&
                            Math.abs(hFovLeft2 - hFovLeft1) < this._distinctThreshold &&
                            Math.abs(hFovRight2 - hFovRight1) < this._distinctThreshold;
                    }));

        this._renderSubscription = observableCombineLatest(
            cameraBearingFov$,
            nodeBearingFov$,
            this._configuration$,
            this._container.renderService.size$).pipe(
            map(
                ([[cb, cf], [no, nfl, nfr], configuration, size]:
                    [[number, number], [number, number, number], IBearingConfiguration, ISize]): IVNodeHash => {

                    const background: vd.VNode = this._createBackground(cb);
                    const fovIndicator: vd.VNode = this._createFovIndicator(nfl, nfr, no);
                    const north: vd.VNode = this._createNorth(cb);
                    const cameraSector: vd.VNode = this._createCircleSectorCompass(
                            this._createCircleSector(Math.max(Math.PI / 20, cf), "#FFF"));

                    const compact: string = configuration.size === ComponentSize.Small ||
                        configuration.size === ComponentSize.Automatic && size.width < 640 ?
                        ".BearingCompact" : "";

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.BearingIndicatorContainer" + compact,
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

    protected _getDefaultConfiguration(): IBearingConfiguration {
        return { size: ComponentSize.Automatic };
    }

    private _createFovIndicator(fovLeft: number, fovRigth: number, offset: number): vd.VNode {
        const arc: vd.VNode = this._createFovArc(fovLeft, fovRigth);

        const group: vd.VNode =
            vd.h(
                "g",
                {
                    attributes: { transform: "translate(18,18)" },
                    namespace: this._svgNamespace,
                },
                [arc]);

        const svg: vd.VNode =
            vd.h(
                "svg",
                {
                    attributes: { viewBox: "0 0 36 36" },
                    namespace: this._svgNamespace,
                    style: {
                        height: "36px",
                        left: "2px",
                        position: "absolute",
                        top: "2px",
                        transform: `rotateZ(${this._spatial.radToDeg(offset)}deg)`,
                        width: "36px",
                    },
                },
                [group]);

        return svg;
    }

    private _createFovArc(fovLeft: number, fovRigth: number): vd.VNode {
        const radius: number = 16.75;
        const strokeWidth: number = 2.5;
        const fov: number = fovLeft + fovRigth;

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

        let arcStart: number = -Math.PI / 2 - fovLeft;
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
                        height: "26px",
                        left: "7px",
                        position: "absolute",
                        top: "7px",
                        width: "26px",
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
            { style: { transform: `rotateZ(${this._spatial.radToDeg(-bearing)}deg)` } },
            [north]);

        return container;
    }

    private _createBackground(bearing: number): vd.VNode {
        return vd.h(
            "div.BearingIndicatorBackground",
            { style: { transform: `rotateZ(${this._spatial.radToDeg(-bearing)}deg)` } },
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
        return this._spatial.radToDeg(2 * Math.atan(x));
    }
}

ComponentService.register(BearingComponent);
export default BearingComponent;
