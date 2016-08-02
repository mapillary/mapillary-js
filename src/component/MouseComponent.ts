/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/merge";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/withLatestFrom";

import {
    ComponentService,
    Component,
} from "../Component";
import {Spatial, Transform} from "../Geo";
import {RenderCamera} from "../Render";
import {
    Container,
    Navigator,
    TouchMove,
    IPinch,
} from "../Viewer";

interface IMovement {
    clientX: number;
    clientY: number;
    movementX: number;
    movementY: number;
}

/**
 * @class MouseComponent
 * @classdesc Component handling mouse and touch events for camera movement.
 */
export class MouseComponent extends Component {
    /** @inheritdoc */
    public static componentName: string = "mouse";

    private _spatial: Spatial;

    private _movementSubscription: Subscription;
    private _mouseWheelSubscription: Subscription;
    private _pinchSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();
    }

    protected _activate(): void {
        let mouseMovement$: Observable<IMovement> =
            this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDrag$)
                .map<IMovement>(
                    (e: MouseEvent): IMovement => {
                        return {
                            clientX: e.clientX,
                            clientY: e.clientY,
                            movementX: e.movementX,
                            movementY: e.movementY,
                        };
                    });

        let touchMovement$: Observable<IMovement> =
            this._container.touchService.singleTouchMove$
                .map<IMovement>(
                    (touch: TouchMove): IMovement => {
                        return {
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            movementX: touch.movementX,
                            movementY: touch.movementY,
                        };
                    });

        this._movementSubscription = Observable
            .merge<IMovement>(
                mouseMovement$,
                touchMovement$)
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (m: IMovement, r: RenderCamera, t: Transform): [IMovement, RenderCamera, Transform] => {
                    return [m, r, t];
                })
            .map<number[]>(
                (mr: [IMovement, RenderCamera, Transform]): number[] => {
                    let m: IMovement = mr[0];
                    let r: RenderCamera = mr[1];
                    let t: Transform = mr[2];

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let canvasX: number = m.clientX - clientRect.left;
                    let canvasY: number = m.clientY - clientRect.top;

                    let currentDirection: THREE.Vector3 =
                        this._unproject(canvasX, canvasY, offsetWidth, offsetHeight, r.perspective)
                        .sub(r.perspective.position);

                    let directionX: THREE.Vector3 =
                        this._unproject(canvasX - m.movementX, canvasY, offsetWidth, offsetHeight, r.perspective)
                        .sub(r.perspective.position);

                    let directionY: THREE.Vector3 =
                        this._unproject(canvasX, canvasY - m.movementY, offsetWidth, offsetHeight, r.perspective)
                        .sub(r.perspective.position);

                    let deltaPhi: number = (m.movementX > 0 ? 1 : -1) * directionX.angleTo(currentDirection);
                    let deltaTheta: number = (m.movementY > 0 ? -1 : 1) * directionY.angleTo(currentDirection);

                    let camera: any = r.camera.clone();

                    let upQuaternion: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 0, 1));
                    let upQuaternionInverse: THREE.Quaternion = upQuaternion.clone().inverse();

                    let offset: THREE.Vector3 = new THREE.Vector3();
                    offset.copy(camera.lookat).sub(camera.position);
                    offset.applyQuaternion(upQuaternion);
                    let length: number = offset.length();

                    let phi: number = Math.atan2(offset.y, offset.x);
                    phi += deltaPhi;

                    let theta: number = Math.atan2(Math.sqrt(offset.x * offset.x + offset.y * offset.y), offset.z);
                    theta += deltaTheta;
                    theta = Math.max(0.01, Math.min(Math.PI - 0.01, theta));

                    offset.x = Math.sin(theta) * Math.cos(phi);
                    offset.y = Math.sin(theta) * Math.sin(phi);
                    offset.z = Math.cos(theta);
                    offset.applyQuaternion(upQuaternionInverse);

                    let lookat: THREE.Vector3 = new THREE.Vector3().copy(camera.position).add(offset.multiplyScalar(length));

                    let basic: number[] = t.projectBasic(lookat.toArray());
                    let original: number[] = t.projectBasic(r.camera.lookat.toArray());

                    let x: number = basic[0] - original[0];
                    let y: number = basic[1] - original[1];

                    if (x > 0.5) {
                        x = x - 1;
                    } else if (x < -0.5) {
                        x = x + 1;
                    }

                    return [x, y];
                })
            .subscribe(
                (basicRotation: number[]): void => {
                    this._navigator.stateService.rotateBasic(basicRotation);
                });

        this._mouseWheelSubscription = this._container.mouseService.mouseWheel$
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (w: WheelEvent, r: RenderCamera, t: Transform): [WheelEvent, RenderCamera, Transform] => {
                    return [w, r, t];
                })
            .subscribe(
                (wr: [WheelEvent, RenderCamera, Transform]): void => {
                    let event: WheelEvent = wr[0];
                    let render: RenderCamera = wr[1];
                    let transform: Transform = wr[2];

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let canvasX: number = event.clientX - clientRect.left;
                    let canvasY: number = event.clientY - clientRect.top;

                    let unprojected: THREE.Vector3 =
                        this._unproject(canvasX, canvasY, offsetWidth, offsetHeight, render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    let zoom: number = -3 * event.deltaY / offsetHeight;

                    this._navigator.stateService.zoomIn(zoom, reference);
                });

        this._pinchSubscription = this._container.touchService.pinch$
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (p: IPinch, r: RenderCamera, t: Transform): [IPinch, RenderCamera, Transform] => {
                    return [p, r, t];
                })
            .subscribe(
                (prt: [IPinch, RenderCamera, Transform]): void => {
                    let pinch: IPinch = prt[0];
                    let render: RenderCamera = prt[1];
                    let transform: Transform = prt[2];

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let unprojected: THREE.Vector3 =
                        this._unproject(
                            pinch.centerClientX - clientRect.left,
                            pinch.centerClientY - clientRect.top,
                            offsetWidth,
                            offsetHeight,
                            render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    let zoom: number = 3 * pinch.distanceChange / Math.min(offsetHeight, offsetWidth);

                    this._navigator.stateService.zoomIn(zoom, reference);
                });

        this._container.mouseService.claimMouse(this._name, 0);
    }

    protected _deactivate(): void {
        this._container.mouseService.unclaimMouse(this._name);

        this._movementSubscription.unsubscribe();
        this._mouseWheelSubscription.unsubscribe();
        this._pinchSubscription.unsubscribe();
    }

    private _unproject(
        canvasX: number,
        canvasY: number,
        offsetWidth: number,
        offsetHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        THREE.Vector3 {

        let projectedX: number = 2 * canvasX / offsetWidth - 1;
        let projectedY: number = 1 - 2 * canvasY / offsetHeight;

        return new THREE.Vector3(projectedX, projectedY, 1).unproject(perspectiveCamera);
    }
}

ComponentService.register(MouseComponent);
export default MouseComponent;
