import * as vd from "virtual-dom";
import { MathUtils } from "three";

import {
    combineLatest as observableCombineLatest,
    Observable,
    Subject,
} from "rxjs";

import {
    distinctUntilChanged,
    map,
    scan,
    skip,
    switchMap,
    takeWhile,
} from "rxjs/operators";

import * as Geo from "../../geo/Geo";

import { Component } from "../Component";
import { BearingConfiguration } from "../interfaces/BearingConfiguration";

import { Spatial } from "../../geo/Spatial";
import { Transform } from "../../geo/Transform";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { Image } from "../../graph/Image";
import { RenderCamera } from "../../render/RenderCamera";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { ComponentSize } from "../util/ComponentSize";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { isSpherical } from "../../geo/Geo";
import { ComponentName } from "../ComponentName";

type ImageFov = [number, number];

type ImageBearingFov = [number, number, number];

type ImageFovState = {
    alpha: number,
    curr: ImageFov,
    prev: ImageFov,
};

interface ImageFovOperation {
    (state: ImageFovState): ImageFovState;
}

/**
 * @class BearingComponent
 *
 * @classdesc Component for indicating bearing and field of view.
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 * var bearingComponent = viewer.getComponent("bearing");
 * bearingComponent.configure({ size: ComponentSize.Small });
 * ```
 */
export class BearingComponent extends Component<BearingConfiguration> {
    public static componentName: ComponentName = "bearing";

    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    private _svgNamespace: string;
    private _distinctThreshold: number;

    private _animationSpeed: number;

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();
        this._viewportCoords = new ViewportCoords();

        this._svgNamespace = "http://www.w3.org/2000/svg";
        this._distinctThreshold = Math.PI / 360;

        this._animationSpeed = 0.075;
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        const cameraBearingFov$ =
            this._container.renderService.renderCamera$.pipe(
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

        const imageFov$ = observableCombineLatest(
            this._navigator.stateService.currentState$.pipe(
                distinctUntilChanged(
                    undefined,
                    (frame: AnimationFrame): string => {
                        return frame.state.currentImage.id;
                    })),
            this._navigator.panService.panImages$).pipe(
                map(
                    ([frame, panImages]:
                        [
                            AnimationFrame,
                            [
                                Image,
                                Transform,
                                number][],
                        ])
                        : ImageFov => {
                        const image: Image = frame.state.currentImage;
                        const transform: Transform = frame.state.currentTransform;

                        if (isSpherical(image.cameraType)) {
                            return [Math.PI, Math.PI];
                        }

                        const currentProjectedPoints =
                            this._computeProjectedPoints(transform);
                        const hFov = this._spatial
                            .degToRad(
                                this._computeHorizontalFov(
                                    currentProjectedPoints));

                        let hFovLeft: number = hFov / 2;
                        let hFovRight: number = hFov / 2;

                        for (const [n, , f] of panImages) {
                            const diff: number = this._spatial.wrap(n.compassAngle - image.compassAngle, -180, 180);
                            if (diff < 0) {
                                hFovLeft = this._spatial.degToRad(Math.abs(diff)) + f / 2;
                            } else {
                                hFovRight = this._spatial.degToRad(Math.abs(diff)) + f / 2;
                            }
                        }

                        return [hFovLeft, hFovRight];
                    }),
                distinctUntilChanged(
                    (
                        [hFovLeft1, hFovRight1]: ImageFov,
                        [hFovLeft2, hFovRight2]: ImageFov): boolean => {

                        return Math.abs(hFovLeft2 - hFovLeft1) < this._distinctThreshold &&
                            Math.abs(hFovRight2 - hFovRight1) < this._distinctThreshold;
                    }));

        const offset$ = observableCombineLatest(
            this._navigator.stateService.currentState$.pipe(
                distinctUntilChanged(
                    undefined,
                    (frame: AnimationFrame): string => {
                        return frame.state.currentImage.id;
                    })),
            this._container.renderService.bearing$).pipe(
                map(
                    ([frame, bearing]: [AnimationFrame, number]): number => {
                        const offset: number = this._spatial.degToRad(frame.state.currentImage.compassAngle - bearing);

                        return offset;
                    }));

        const imageFovOperation$ = new Subject<ImageFovOperation>();

        const smoothImageFov$ = imageFovOperation$.pipe(
            scan(
                (state: ImageFovState, operation: ImageFovOperation): ImageFovState => {
                    return operation(state);
                },
                { alpha: 0, curr: [0, 0, 0], prev: [0, 0, 0] }),
            map(
                (state: ImageFovState): ImageFov => {
                    const alpha = MathUtils.smootherstep(state.alpha, 0, 1);
                    const curr = state.curr;
                    const prev = state.prev;

                    return [
                        this._interpolate(prev[0], curr[0], alpha),
                        this._interpolate(prev[1], curr[1], alpha),
                    ];
                }));

        subs.push(imageFov$.pipe(
            map(
                (nbf: ImageFov): ImageFovOperation => {
                    return (state: ImageFovState): ImageFovState => {
                        const a = MathUtils.smootherstep(state.alpha, 0, 1);
                        const c = state.curr;
                        const p = state.prev;

                        const prev: ImageFov = [
                            this._interpolate(p[0], c[0], a),
                            this._interpolate(p[1], c[1], a),
                        ];

                        const curr: ImageFov = <ImageFov>nbf.slice();

                        return {
                            alpha: 0,
                            curr: curr,
                            prev: prev,
                        };
                    };
                }))
            .subscribe(imageFovOperation$));

        subs.push(imageFov$.pipe(
            switchMap(
                (): Observable<number> => {
                    return this._container.renderService.renderCameraFrame$.pipe(
                        skip(1),
                        scan<RenderCamera, number>(
                            (alpha: number): number => {
                                return alpha + this._animationSpeed;
                            },
                            0),
                        takeWhile(
                            (alpha: number): boolean => {
                                return alpha <= 1 + this._animationSpeed;
                            }),
                        map(
                            (alpha: number): number => {
                                return Math.min(alpha, 1);
                            }));
                }),
            map(
                (alpha: number): ImageFovOperation => {
                    return (nbfState: ImageFovState): ImageFovState => {
                        return {
                            alpha: alpha,
                            curr: <ImageFov>nbfState.curr.slice(),
                            prev: <ImageFov>nbfState.prev.slice(),
                        };
                    };
                }))
            .subscribe(imageFovOperation$));

        const imageBearingFov$ = observableCombineLatest(
            offset$,
            smoothImageFov$).pipe(
                map(
                    ([offset, fov]: [number, ImageFov]): ImageBearingFov => {
                        return [offset, fov[0], fov[1]];
                    }));

        subs.push(observableCombineLatest(
            cameraBearingFov$,
            imageBearingFov$,
            this._configuration$,
            this._container.renderService.size$).pipe(
                map(
                    ([[cb, cf], [no, nfl, nfr], configuration, size]:
                        [[number, number], [number, number, number], BearingConfiguration, ViewportSize]): VirtualNodeHash => {

                        const background: vd.VNode = this._createBackground(cb);
                        const fovIndicator: vd.VNode = this._createFovIndicator(nfl, nfr, no);
                        const north: vd.VNode = this._createNorth(cb);
                        const cameraSector: vd.VNode = this._createCircleSectorCompass(
                            this._createCircleSector(Math.max(Math.PI / 20, cf), "#FFF"));

                        const compact: string = configuration.size === ComponentSize.Small ||
                            configuration.size === ComponentSize.Automatic && size.width < 640 ?
                            ".mapillary-bearing-compact" : "";

                        return {
                            name: this._name,
                            vNode: vd.h(
                                "div.mapillary-bearing-indicator-container" + compact,
                                { oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); } },
                                [
                                    background,
                                    fovIndicator,
                                    north,
                                    cameraSector,
                                ]),
                        };
                    }))
            .subscribe(this._container.domRenderer.render$));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): BearingConfiguration {
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
        const north: vd.VNode = vd.h("div.mapillary-bearing-north", []);
        const container: vd.VNode = vd.h(
            "div.mapillary-bearing-north-container",
            { style: { transform: `rotateZ(${this._spatial.radToDeg(-bearing)}deg)` } },
            [north]);

        return container;
    }

    private _createBackground(bearing: number): vd.VNode {
        return vd.h(
            "div.mapillary-bearing-indicator-background",
            { style: { transform: `rotateZ(${this._spatial.radToDeg(-bearing)}deg)` } },
            [
                vd.h("div.mapillary-bearing-indicator-background-circle", []),
                vd.h(
                    "div.mapillary-bearing-indicator-background-arrow-container",
                    [
                        vd.h("div.mapillary-bearing-indicator-background-arrow", []),
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

    private _interpolate(x1: number, x2: number, alpha: number): number {
        return (1 - alpha) * x1 + alpha * x2;
    }
}
