/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/merge";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/withLatestFrom";

import {
    ComponentService,
    Component,
    IComponentConfiguration,
} from "../Component";
import {Camera, Spatial, Transform} from "../Geo";
import {IVNodeHash, RenderCamera} from "../Render";
import {ICurrentState, IFrame} from "../State";
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
export class MouseComponent extends Component<IComponentConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "mouse";

    private _spatial: Spatial;

    private _activeSubscription: Subscription;
    private _cursorSubscription: Subscription;
    private _movementSubscription: Subscription;
    private _mouseWheelSubscription: Subscription;
    private _pinchSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();
    }

    protected _activate(): void {
        let draggingStarted$: Observable<boolean> =
             this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDragStart$)
                .map(
                    (event: MouseEvent): boolean => {
                        return true;
                    });

        let draggingStopped$: Observable<boolean> =
             this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDragEnd$)
                .map(
                    (event: MouseEvent): boolean => {
                        return false;
                    });

        let dragging$: Observable<boolean> = Observable
            .merge(
                draggingStarted$,
                draggingStopped$)
            .startWith(false)
            .share();

        this._activeSubscription = dragging$
            .subscribe(this._container.mouseService.activate$);

        this._cursorSubscription = dragging$
            .map(
                (dragging: boolean): IVNodeHash => {
                    let className: string = dragging ? "MouseContainerGrabbing" : "MouseContainerGrab";
                    let vNode: vd.VNode = vd.h("div." + className, {}, []);

                    return { name: this._name, vnode: vNode };
                })
            .subscribe(this._container.domRenderer.render$);

        let mouseMovement$: Observable<IMovement> =
            this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDrag$)
                .map(
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
                .map(
                    (touch: TouchMove): IMovement => {
                        return {
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            movementX: touch.movementX,
                            movementY: touch.movementY,
                        };
                    });

        this._movementSubscription = Observable
            .merge(
                mouseMovement$,
                touchMovement$)
            .withLatestFrom(
                this._navigator.stateService.currentState$,
                (m: IMovement, f: IFrame): [IMovement, IFrame] => {
                    return [m, f];
                })
            .filter(
                (args: [IMovement, IFrame]): boolean => {
                    let state: ICurrentState = args[1].state;
                    return state.currentNode.fullPano || state.nodesAhead < 1;
                })
            .map(
                (args: [IMovement, IFrame]): IMovement => {
                    return args[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                this._navigator.stateService.currentCamera$,
                (m: IMovement, r: RenderCamera, t: Transform, c: Camera): [IMovement, RenderCamera, Transform, Camera] => {
                    return [m, r, t, c];
                })
            .map(
                (args: [IMovement, RenderCamera, Transform, Camera]): number[] => {
                    let movement: IMovement = args[0];
                    let render: RenderCamera = args[1];
                    let transform: Transform = args[2];
                    let camera: Camera = args[3].clone();

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let canvasX: number = movement.clientX - clientRect.left;
                    let canvasY: number = movement.clientY - clientRect.top;

                    let currentDirection: THREE.Vector3 =
                        this._unproject(canvasX, canvasY, offsetWidth, offsetHeight, render.perspective)
                            .sub(render.perspective.position);

                    let directionX: THREE.Vector3 =
                        this._unproject(canvasX - movement.movementX, canvasY, offsetWidth, offsetHeight, render.perspective)
                            .sub(render.perspective.position);

                    let directionY: THREE.Vector3 =
                        this._unproject(canvasX, canvasY - movement.movementY, offsetWidth, offsetHeight, render.perspective)
                            .sub(render.perspective.position);

                    let deltaPhi: number = (movement.movementX > 0 ? 1 : -1) * directionX.angleTo(currentDirection);
                    let deltaTheta: number = (movement.movementY > 0 ? -1 : 1) * directionY.angleTo(currentDirection);

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

                    let basic: number[] = transform.projectBasic(lookat.toArray());
                    let original: number[] = transform.projectBasic(camera.lookat.toArray());

                    let x: number = basic[0] - original[0];
                    let y: number = basic[1] - original[1];

                    if (Math.abs(x) > 1) {
                        x = 0;
                    } else if (x > 0.5) {
                        x = x - 1;
                    } else if (x < -0.5) {
                        x = x + 1;
                    }

                    return [this._spatial.clamp(x, -0.05, 0.05), this._spatial.clamp(y, -0.05, 0.05)];
                })
            .subscribe(
                (basicRotation: number[]): void => {
                    this._navigator.stateService.rotateBasic(basicRotation);
                });

        this._mouseWheelSubscription = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseWheel$)
            .withLatestFrom(
                this._navigator.stateService.currentState$,
                (w: WheelEvent, f: IFrame): [WheelEvent, IFrame] => {
                    return [w, f];
                })
            .filter(
                (args: [WheelEvent, IFrame]): boolean => {
                    let state: ICurrentState = args[1].state;
                    return state.currentNode.fullPano || state.nodesAhead < 1;
                })
            .map(
                (args: [WheelEvent, IFrame]): WheelEvent => {
                    return args[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (w: WheelEvent, r: RenderCamera, t: Transform): [WheelEvent, RenderCamera, Transform] => {
                    return [w, r, t];
                })
            .subscribe(
                (args: [WheelEvent, RenderCamera, Transform]): void => {
                    let event: WheelEvent = args[0];
                    let render: RenderCamera = args[1];
                    let transform: Transform = args[2];

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let canvasX: number = event.clientX - clientRect.left;
                    let canvasY: number = event.clientY - clientRect.top;

                    let unprojected: THREE.Vector3 =
                        this._unproject(canvasX, canvasY, offsetWidth, offsetHeight, render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    let deltaY: number = event.deltaY;
                    if (event.deltaMode === 1) {
                        deltaY = 40 * deltaY;
                    } else if (event.deltaMode === 2) {
                        deltaY = 800 * deltaY;
                    }

                    let zoom: number = -3 * deltaY / offsetHeight;

                    this._navigator.stateService.zoomIn(zoom, reference);
                });

        this._pinchSubscription = this._container.touchService.pinch$
            .withLatestFrom(
                this._navigator.stateService.currentState$,
                (p: IPinch, f: IFrame): [IPinch, IFrame] => {
                    return [p, f];
                })
            .filter(
                (args: [IPinch, IFrame]): boolean => {
                    let state: ICurrentState = args[1].state;
                    return state.currentNode.fullPano || state.nodesAhead < 1;
                })
            .map(
                (args: [IPinch, IFrame]): IPinch => {
                    return args[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (p: IPinch, r: RenderCamera, t: Transform): [IPinch, RenderCamera, Transform] => {
                    return [p, r, t];
                })
            .subscribe(
                (args: [IPinch, RenderCamera, Transform]): void => {
                    let pinch: IPinch = args[0];
                    let render: RenderCamera = args[1];
                    let transform: Transform = args[2];

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

        this._activeSubscription.unsubscribe();
        this._cursorSubscription.unsubscribe();
        this._movementSubscription.unsubscribe();
        this._mouseWheelSubscription.unsubscribe();
        this._pinchSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
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
