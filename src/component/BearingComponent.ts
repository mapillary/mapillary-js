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
                    let hFov: number = 2 * Math.atan(0.5 * transform.basicWidth / (size * transform.focal));

                    return [node.ca, Math.round(this._spatial.radToDeg(hFov))];
                })
            .distinctUntilChanged(
                (a1: [number, number], a2: [number, number]): boolean => {
                    return a1[0] === a2[0] && a1[1] === a2[1];
                });

        Observable
            .combineLatest(
                cameraBearingFov$,
                nodeBearingFov$)
            .map(
                (args: [[number, number], [number, number]]): IVNodeHash => {
                    let backgroundImageSegment: string =
                        `linear-gradient(${args[0][0] + 90 + Math.max(5, args[0][1] / 2)}deg, transparent 50%, #555555 50%),` +
                        `linear-gradient(${args[0][0] + 90 - Math.max(5, args[0][1] / 2)}deg, #555555 50%, transparent 50%)`;

                    let backgroundColorFov: string = args[1][1] >= 180 ? "black" : "#555555";
                    let foregroundColorFov: string = args[1][1] >= 180 ? "#555555" : "black";

                    let firstGradient: string = args[1][1] >= 180 ?
                        `${foregroundColorFov} 50%, transparent 50%` :
                        `transparent 50%, ${foregroundColorFov} 50%`;

                    let secondGradient: string = args[1][1] >= 180 ?
                        `transparent 50%, ${foregroundColorFov} 50%` :
                        `${foregroundColorFov} 50%, transparent 50%`;

                    let backgroundImageFov: string =
                        `linear-gradient(${args[1][0] + 90 + args[1][1] / 2}deg, ${firstGradient}),` +
                        `linear-gradient(${args[1][0] + 90 - args[1][1] / 2}deg, ${secondGradient})`;

                    let fovProperties: vd.createProperties = {
                        style: {
                            "background-color": backgroundColorFov,
                            "background-image": backgroundImageFov,
                        },
                    };

                    let segmentProperties: vd.createProperties = { style: { "background-image": backgroundImageSegment } };

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.BearingIndicator",
                            {},
                            [
                                vd.h("div.BearingIndicatorFov", fovProperties, []),
                                vd.h("div.BearingIndicatorSegment", segmentProperties, []),
                                vd.h("div.BearingIndicatorCenterBorder", {}, []),
                                vd.h("div.BearingIndicatorCenter", {}, []),
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

}

ComponentService.register(BearingComponent);
export default BearingComponent;
