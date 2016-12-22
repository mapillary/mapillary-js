/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Subscription} from "rxjs/Subscription";

import {
    Component,
    ComponentService,
    IComponentConfiguration,
} from "../Component";
import {
    Camera,
    Spatial,
} from "../Geo";
import {Node} from "../Graph";
import {
    IVNodeHash,
    RenderCamera,
} from "../Render";
import {IRotation} from "../State";
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
        this._container.renderService.renderCamera$
            .map(
                (rc: RenderCamera): [number, number] => {
                    let direction: THREE.Vector3 = this._directionFromCamera(rc.camera);
                    let rotation: number = this._getRotation(direction, rc.camera.up);

                    let vFov: number = this._spatial.degToRad(rc.perspective.fov);
                    let hFov: number = Math.atan(rc.perspective.aspect * Math.tan(0.5 * vFov)) * 2;

                    return [Math.round(this._spatial.wrap(-this._spatial.radToDeg(rotation) + 90, 0, 360)), Math.round(this._spatial.radToDeg(hFov))];
                })
            .map(
                (args: [number, number]): IVNodeHash => {
                    let backgroundImage: string =
                        `linear-gradient(${args[0] + 90 + args[1]/2}deg, transparent 50%, #555555 50%),` +
                        `linear-gradient(${args[0] + 90 - args[1]/2}deg, #555555 50%, transparent 50%)`

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.BearingIndicator",
                            {},
                            [
                                vd.h("div.BearingIndicatorSegment", { style: { "background-image": backgroundImage } }, []),
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
