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
                        "div.BearingIndicatorCompass",
                        {},
                        [
                            vd.h("div.BearingIndicatorCompassRectangle", {}, []),
                            vd.h("div.BearingIndicatorCompassCircle", {}, []),
                        ]);

                    let north: vd.VNode = vd.h("div.BearingIndicatorNorth", {}, []);

                    let nodeSectors: vd.VNode[] =
                        this._createCircleSector(
                            args[0][0],
                            args[0][1],
                            "Node");

                    let cameraSectors: vd.VNode[] =
                        this._createCircleSector(
                            args[1][0],
                            args[1][1],
                            "Camera");

                    let container: vd.VNode = vd.h("div.BearingIndicatorContainer", {}, nodeSectors.concat(cameraSectors));
                    let centerBorder: vd.VNode = vd.h("div.BearingIndicatorCenterBorder", {}, []);
                    let center: vd.VNode = vd.h("div.BearingIndicatorCenter", {}, []);

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.BearingIndicator",
                            {},
                            [
                                compass,
                                north,
                                container,
                                centerBorder,
                                center,
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

    private _createCircleSector(bearing: number, fov: number, className: string): vd.VNode[] {
        if (fov === 0) {
            return [];
        }

        if (fov >= 357) {
            return [this._createCircle(className)];
        }

        let circleSector: vd.VNode[] = [];

        let fovStart: number = bearing - fov / 2;
        let fovLeft: number = Math.max(bearing + fov / 2 - fovStart, 8);

        while (fovLeft > 1) {
            let fovPart: number = Math.min(fovLeft, 90);

            circleSector.push(this._createCircleSectorPart(fovStart, fovPart, className));

            fovStart += Math.min(fovPart, 89);
            fovLeft -= Math.min(fovPart, 89);
        }

        return circleSector;
    }

    private _createCircleSectorPart(startAngle: number, centralAngle: number, className: string): vd.VNode {
        let skew: number = 90 - centralAngle;

        let sectorProperties: vd.createProperties = {
            style: {
                transform: `rotate(${startAngle}deg) skewY(${-skew}deg)`,
            },
        };

        let contentProperties: vd.createProperties = {
            style: {
                transform: `skewY(${skew}deg)`,
            },
        };

        let sectorElement: string = `div.BearingIndicator${className}Sector`;
        let contentElement: string = `div.BearingIndicator${className}Content`;

        return vd.h(sectorElement, sectorProperties, [vd.h(contentElement, contentProperties, [])]);
    }

    private _createCircle(className: string): vd.VNode {
        let fullSectorElement: string = `div.BearingIndicator${className}FullSector`;

        return vd.h(fullSectorElement, {}, []);
    }
}

ComponentService.register(BearingComponent);
export default BearingComponent;
