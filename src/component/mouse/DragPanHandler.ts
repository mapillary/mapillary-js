/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/operator/concat";
import "rxjs/add/operator/sample";
import "rxjs/add/operator/takeWhile";

import {
    Component,
    IMouseConfiguration,
    HandlerBase,
    MouseTouchPair,
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
import {IFrame} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";

/**
 * The `DragPanHandler` allows the user to pan the viewer photo by clicking and dragging the cursor.
 *
 * @example
 * ```
 * var mouseComponent = viewer.getComponent("mouse");
 *
 * mouseComponent.dragPan.disable();
 * mouseComponent.dragPan.enable();
 *
 * var isEnabled = mouseComponent.dragPan.isEnabled;
 * ```
 */
export class DragPanHandler extends HandlerBase<IMouseConfiguration> {
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    private _basicRotationThreshold: number;
    private _forceCoeff: number;

    private _activeMouseSubscription: Subscription;
    private _activeTouchSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _rotateBasicSubscription: Subscription;
    private _rotateBasicWithoutInertiaSubscription: Subscription;

    constructor(
        component: Component<IMouseConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords,
        spatial: Spatial) {
        super(component, container, navigator);

        this._spatial = spatial;
        this._viewportCoords = viewportCoords;

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
                    })
                .share();

        let draggingStopped$: Observable<boolean> =
             this._container.mouseService
                .filtered$(this._component.name, this._container.mouseService.mouseDragEnd$)
                .map(
                    (event: Event): boolean => {
                        return false;
                    })
                .share();

        this._activeMouseSubscription = Observable
            .merge(
                draggingStarted$,
                draggingStopped$)
            .subscribe(this._container.mouseService.activate$);

        this._preventDefaultSubscription = Observable
            .merge(
                draggingStarted$,
                draggingStopped$)
            .switchMap(
                (dragging: boolean): Observable<MouseEvent> => {
                    return dragging ?
                        this._container.mouseService.documentMouseMove$ :
                        Observable.empty<MouseEvent>();
                })
            .merge(this._container.touchService.touchMove$)
            .subscribe(
                (event: MouseEvent | TouchEvent): void => {
                    event.preventDefault(); // prevent selection of content outside the viewer
                });

        let touchMovingStarted$: Observable<boolean> =
            this._container.touchService.singleTouchDragStart$
                .map(
                    (event: TouchEvent): boolean => {
                        return true;
                    });

        let touchMovingStopped$: Observable<boolean> =
            this._container.touchService.singleTouchDragEnd$
                .map(
                    (event: TouchEvent): boolean => {
                        return false;
                    });

        this._activeTouchSubscription = Observable
            .merge(
                touchMovingStarted$,
                touchMovingStopped$)
            .subscribe(this._container.touchService.activate$);

        const basicRotation$: Observable<number[]> = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): boolean => {
                    return frame.state.currentNode.fullPano || frame.state.nodesAhead < 1;
                })
            .distinctUntilChanged()
            .switchMap(
                (enable: boolean): Observable<MouseTouchPair> => {
                    if (!enable) {
                        return Observable.empty<MouseTouchPair>();
                    }

                    const mouseDrag$: Observable<[MouseEvent, MouseEvent]> = this._container.mouseService
                        .filtered$(this._component.name, this._container.mouseService.mouseDragStart$)
                        .switchMap(
                            (mouseDragStart: MouseEvent): Observable<MouseEvent> => {
                                return Observable
                                    .of(mouseDragStart)
                                    .concat(
                                        this._container.mouseService
                                            .filtered$(this._component.name, this._container.mouseService.mouseDrag$))
                                    .merge(
                                        this._container.mouseService
                                            .filtered$(this._component.name, this._container.mouseService.mouseDragEnd$)
                                            .map(
                                                (e: Event): MouseEvent => {
                                                    return null;
                                                }))
                                    .takeWhile(
                                        (e: MouseEvent): boolean => {
                                            return !!e;
                                        })
                                    .startWith(null);
                            })
                        .pairwise()
                        .filter(
                            (pair: [MouseEvent, MouseEvent]): boolean => {
                                return pair[0] != null && pair[1] != null;
                            });

                    const singleTouchDrag$: Observable<[Touch, Touch]> = Observable
                        .merge(
                            this._container.touchService.singleTouchDragStart$,
                            this._container.touchService.singleTouchDrag$,
                            this._container.touchService.singleTouchDragEnd$.map((t: TouchEvent): TouchEvent => { return null; }))
                        .map(
                            (event: TouchEvent): Touch => {
                                return event != null && event.touches.length > 0 ?
                                    event.touches[0] : null;
                            })
                        .pairwise()
                        .filter(
                            (pair: [Touch, Touch]): boolean => {
                                return pair[0] != null && pair[1] != null;
                            });

                    return Observable
                        .merge(
                            mouseDrag$,
                            singleTouchDrag$);
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                this._navigator.stateService.currentCamera$)
            .map(
                ([events, render, transform, c]: [MouseTouchPair, RenderCamera, Transform, Camera]): number[] => {
                    let camera: Camera = c.clone();

                    let previousEvent: MouseEvent | Touch = events[0];
                    let event: MouseEvent | Touch = events[1];

                    let movementX: number = event.clientX - previousEvent.clientX;
                    let movementY: number = event.clientY - previousEvent.clientY;

                    let element: HTMLElement = this._container.element;

                    let [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);

                    let currentDirection: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY,
                            element,
                            render.perspective)
                                .sub(render.perspective.position);

                    let directionX: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX - movementX,
                            canvasY,
                            element,
                            render.perspective)
                                .sub(render.perspective.position);

                    let directionY: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY - movementY,
                            element,
                            render.perspective)
                                .sub(render.perspective.position);

                    let deltaPhi: number = (movementX > 0 ? 1 : -1) * directionX.angleTo(currentDirection);
                    let deltaTheta: number = (movementY > 0 ? -1 : 1) * directionY.angleTo(currentDirection);

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
                            this._container.element,
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
            .share();

        this._rotateBasicWithoutInertiaSubscription = basicRotation$
            .subscribe(
                (basicRotation: number[]): void => {
                    this._navigator.stateService.rotateBasicWithoutInertia(basicRotation);
                });

        this._rotateBasicSubscription = basicRotation$
            .scan(
                (rotationBuffer: [number, number[]][], rotation: number[]): [number, number[]][] => {
                    this._drainBuffer(rotationBuffer);

                    rotationBuffer.push([Date.now(), rotation]);

                    return rotationBuffer;
                },
                [])
            .sample(
                Observable
                    .merge(
                        this._container.mouseService.filtered$(
                            this._component.name,
                            this._container.mouseService.mouseDragEnd$),
                        this._container.touchService.singleTouchDragEnd$))
            .map(
                (rotationBuffer: [number, number[]][]): number[] => {
                    const drainedBuffer: [number, number[]][] = this._drainBuffer(rotationBuffer.slice());
                    const basicRotation: number[] = [0, 0];

                    for (const rotation of drainedBuffer) {
                        basicRotation[0] += rotation[1][0];
                        basicRotation[1] += rotation[1][1];
                    }

                    const count: number = drainedBuffer.length;
                    if (count > 0) {
                        basicRotation[0] /= count;
                        basicRotation[1] /= count;
                    }

                    return basicRotation;
                })
            .subscribe(
                (basicRotation: number[]): void => {
                    this._navigator.stateService.rotateBasic(basicRotation);
                });
    }

    protected _disable(): void {
        this._activeMouseSubscription.unsubscribe();
        this._activeTouchSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._rotateBasicSubscription.unsubscribe();
        this._rotateBasicWithoutInertiaSubscription.unsubscribe();

        this._activeMouseSubscription = null;
        this._activeTouchSubscription = null;
        this._preventDefaultSubscription = null;
        this._rotateBasicSubscription = null;
    }

    protected _getConfiguration(enable: boolean): IMouseConfiguration {
        return { dragPan: enable };
    }

    private _drainBuffer<T>(buffer: [number, T][]): [number, T][] {
        const cutoff: number = 50;
        const now: number = Date.now();

        while (buffer.length > 0 && now - buffer[0][0] > cutoff) {
            buffer.shift();
        }

        return buffer;
    }
}

export default DragPanHandler;
