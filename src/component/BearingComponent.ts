/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    Component,
    ComponentService,
    IComponentConfiguration,
} from "../Component";
import {
    Camera,
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

    private _renderSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();
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
                        let hFov: number = 360 * node.gpano.CroppedAreaImageWidthPixels / node.gpano.FullPanoWidthPixels;

                        return [node.ca, hFov];
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

                    return [node.ca, Math.round(this._spatial.radToDeg(hFov))];
                })
            .distinctUntilChanged(
                (a1: [number, number], a2: [number, number]): boolean => {
                    return a1[0] === a2[0] && a1[1] === a2[1];
                });

        let cameraBearingFov$: Observable<[number, number]> = this._container.renderService.renderCamera$
            .map(
                (rc: RenderCamera): [number, number] => {
                    let direction: THREE.Vector3 = this._directionFromCamera(rc.camera);
                    let rotation: number = this._getRotation(direction, rc.camera.up);

                    let vFov: number = this._spatial.degToRad(rc.perspective.fov);
                    let hFov: number = Math.atan(rc.perspective.aspect * Math.tan(0.5 * vFov)) * 2;

                    return [
                        Math.round(this._spatial.wrap(-this._spatial.radToDeg(rotation) + 90, 0, 360)),
                        Math.round(this._spatial.radToDeg(hFov)),
                    ];
                })
            .distinctUntilChanged(
                (a1: [number, number], a2: [number, number]): boolean => {
                    return a1[0] === a2[0] && a1[1] === a2[1];
                });

        Observable
            .combineLatest(
                nodeBearingFov$,
                cameraBearingFov$)
            .map(
                (args: [[number, number], [number, number]]): IVNodeHash => {
                    let compass: vd.VNode = vd.h(
                        "div.FovIndicatorCompass",
                        {},
                        [
                            vd.h("div.FovIndicatorCompassRectangle", {}, []),
                            vd.h("div.FovIndicatorCompassCircle", {}, []),
                        ]);

                    let north: vd.VNode = vd.h("div.FovIndicatorNorth", {}, []);

                    let nodeSegments: vd.VNode[] =
                        this._createCircleSegment(
                            args[0][0],
                            args[0][1],
                            "Node");

                    let cameraSegments: vd.VNode[] =
                        this._createCircleSegment(
                            args[1][0],
                            args[1][1],
                            "Camera");

                    let container: vd.VNode = vd.h("div.FovIndicatorContainer", {}, nodeSegments.concat(cameraSegments));
                    let center: vd.VNode = vd.h("div.FovIndicatorCenterBorder", {}, []);
                    let centerBorder: vd.VNode = vd.h("div.FovIndicatorCenter", {}, []);

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.FovIndicator",
                            {},
                            [
                                compass,
                                north,
                                container,
                                center,
                                centerBorder,
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

    private _directionFromCamera(camera: Camera): THREE.Vector3 {
        return camera.lookat.clone().sub(camera.position);
    }

    private _getRotation(direction: THREE.Vector3, up: THREE.Vector3): number {
       let upProjection: number = direction.clone().dot(up);
       let planeProjection: THREE.Vector3 = direction.clone().sub(up.clone().multiplyScalar(upProjection));

       let phi: number = Math.atan2(planeProjection.y, planeProjection.x);

       return phi;
    }

    private _createCircleSegment(bearing: number, fov: number, className: string): vd.VNode[] {
        if (fov >= 357) {
            return [this._createFullCircleSegment(className)];
        }

        fov = Math.max(8, fov);
        let rotate: number = bearing - fov / 2;
        let skew: number = fov - 90;

        let segmentProperties: vd.createProperties = {
            style: {
                transform: `rotate(${rotate}deg) skewY(${skew}deg)`,
            },
        };

        let contentProperties: vd.createProperties = {
            style: {
                transform: `skewY(${-skew}deg)`,
            },
        };

        let segmentElement: string = `div.FovIndicator${className}Segment`;
        let contentElement: string = `div.FovIndicator${className}Content`;

        return [vd.h(segmentElement, segmentProperties, [vd.h(contentElement, contentProperties, [])])];
    }

    private _createFullCircleSegment(className: string): vd.VNode {
        let fullSegmentElement: string = `div.FovIndicator${className}FullSegment`;

        return vd.h(fullSegmentElement, {}, []);
    }
}

ComponentService.register(BearingComponent);
export default BearingComponent;
