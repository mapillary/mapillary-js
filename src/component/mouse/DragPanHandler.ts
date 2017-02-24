/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    Component,
    IMouseConfiguration,
    MouseHandlerBase,
} from "../../Component";
import {
    Camera,
    Spatial,
    Transform,
    ViewportCoords,
} from "../../Geo";
import {
    RenderCamera,
} from "../../Render";
import {
    ICurrentState,
    IFrame,
} from "../../State";
import {
    Container,
    Navigator,
    TouchMove,
} from "../../Viewer";

interface IMovement {
    clientX: number;
    clientY: number;
    movementX: number;
    movementY: number;
}

export class DragPanHandler extends MouseHandlerBase<IMouseConfiguration> {
    private _spatial: Spatial;

    private _basicRotationThreshold: number;
    private _forceCoeff: number;

    private _activeMouseSubscription: Subscription;
    private _activeTouchSubscription: Subscription;
    private _rotateBasicSubscription: Subscription;

    constructor(
        component: Component<IMouseConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords,
        spatial: Spatial) {
        super(component, container, navigator, viewportCoords);

        this._spatial = spatial;

        this._basicRotationThreshold = 5e-2;
        this._forceCoeff = 2e-1;
    }

    protected _enable(): void {
        let draggingStarted$: Observable<boolean> =
             this._container.mouseService
                .filtered$(this._component.name, this._container.mouseService.mouseDragStart$)
                .map(
                    (event: MouseEvent): boolean => {
                        return true;
                    });

        let draggingStopped$: Observable<boolean> =
             this._container.mouseService
                .filtered$(this._component.name, this._container.mouseService.mouseDragEnd$)
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

        this._activeMouseSubscription = dragging$
            .subscribe(this._container.mouseService.activate$);

        let touchMovingStarted$: Observable<boolean> =
            this._container.touchService.singleTouchMoveStart$
                .map(
                    (event: TouchMove): boolean => {
                        return true;
                    });

        let touchMovingStopped$: Observable<boolean> =
            this._container.touchService.singleTouchMoveEnd$
                .map(
                    (event: TouchEvent): boolean => {
                        return false;
                    });

        let touchMoving$: Observable<boolean> = Observable
            .merge(
                touchMovingStarted$,
                touchMovingStopped$)
            .startWith(false)
            .share();

        this._activeTouchSubscription = touchMoving$
            .subscribe(this._container.touchService.activate$);


        let mouseMovement$: Observable<IMovement> =
            this._container.mouseService
                .filtered$(this._component.name, this._container.mouseService.mouseDrag$)
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

        this._rotateBasicSubscription = Observable
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
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY,
                            offsetWidth,
                            offsetHeight,
                            render.perspective)
                                .sub(render.perspective.position);

                    let directionX: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX - movement.movementX,
                            canvasY,
                            offsetWidth,
                            offsetHeight,
                            render.perspective)
                                .sub(render.perspective.position);

                    let directionY: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY - movement.movementY,
                            offsetWidth,
                            offsetHeight,
                            render.perspective)
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

                    let rotationThreshold: number = this._basicRotationThreshold;

                    x = this._spatial.clamp(x, -rotationThreshold, rotationThreshold);
                    y = this._spatial.clamp(y, -rotationThreshold, rotationThreshold);

                    if (transform.fullPano) {
                        return [x, y];
                    }

                    let pixelDistances: number[] =
                        this._viewportCoords.getPixelDistances(
                            this._container.element.offsetWidth,
                            this._container.element.offsetHeight,
                            transform,
                            render.perspective);

                    let coeff: number = this._forceCoeff;

                    if (pixelDistances[0] > 0 && y < 0 && basic[1] < 0.5) {
                        y /= Math.max(1, coeff * pixelDistances[0]);
                    }

                    if (pixelDistances[1] > 0 && x > 0 && basic[0] > 0.5) {
                        x /= Math.max(1, coeff * pixelDistances[1]);
                    }

                    if (pixelDistances[2] > 0 && y > 0 && basic[1] > 0.5) {
                        y /= Math.max(1, coeff * pixelDistances[2]);
                    }

                    if (pixelDistances[3] > 0 && x < 0 && basic[0] < 0.5) {
                        x /= Math.max(1, coeff * pixelDistances[3]);
                    }

                    return [x, y];
                })
            .subscribe(
                (basicRotation: number[]): void => {
                    this._navigator.stateService.rotateBasic(basicRotation);
                });
    }

    protected _disable(): void {
        this._activeMouseSubscription.unsubscribe();
        this._activeTouchSubscription.unsubscribe();
        this._rotateBasicSubscription.unsubscribe();

        this._activeMouseSubscription.unsubscribe();
        this._activeTouchSubscription.unsubscribe();
        this._rotateBasicSubscription = null;
    }

    protected _getConfiguration(enable: boolean): IMouseConfiguration {
        return { dragPan: enable };
    }
}

export default DragPanHandler;
