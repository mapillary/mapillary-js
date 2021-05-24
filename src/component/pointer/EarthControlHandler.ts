import * as THREE from "three";

import {
    empty as observableEmpty,
    Observable,
} from "rxjs";

import {
    map,
    filter,
    withLatestFrom,
    switchMap,
    publishReplay,
    refCount,
} from "rxjs/operators";

import { Transform } from "../../geo/Transform";
import { Spatial } from "../../geo/Spatial";
import { EulerRotation } from "../../state/interfaces/EulerRotation";
import { State } from "../../state/State";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { RenderCamera } from "../../render/RenderCamera";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { Component } from "../Component";
import { PointerConfiguration } from "../interfaces/PointerConfiguration";
import { HandlerBase } from "../util/HandlerBase";
import { MouseOperator } from "../util/MouseOperator";
import { SubscriptionHolder } from "../../util/SubscriptionHolder";


export class EarthControlHandler extends HandlerBase<PointerConfiguration> {
    private _viewportCoords: ViewportCoords;
    private _spatial: Spatial;
    private _subscriptions: SubscriptionHolder;

    /** @ignore */
    constructor(
        component: Component<PointerConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords,
        spatial: Spatial) {
        super(component, container, navigator);

        this._spatial = spatial;
        this._viewportCoords = viewportCoords;
        this._subscriptions = new SubscriptionHolder();
    }

    protected _enable(): void {
        const earth$ = this._navigator.stateService.state$.pipe(
            map(
                (state: State): boolean => {
                    return state === State.Earth;
                }),
            publishReplay(1),
            refCount());

        const subs = this._subscriptions;

        subs.push(earth$.pipe(
            switchMap(
                (earth: boolean): Observable<MouseEvent> => {
                    return earth ?
                        this._container.mouseService.mouseWheel$ :
                        observableEmpty();
                }))
            .subscribe(
                (event: WheelEvent): void => {
                    event.preventDefault();
                }));

        subs.push(earth$.pipe(
            switchMap(
                (earth: boolean): Observable<[MouseEvent, MouseEvent]> => {
                    if (!earth) {
                        return observableEmpty();
                    }

                    return MouseOperator.filteredPairwiseMouseDrag$(this._component.name, this._container.mouseService).pipe(
                        filter(
                            ([e1, e2]: [MouseEvent, MouseEvent]): boolean => {
                                return !(e1.ctrlKey && e2.ctrlKey);
                            }));
                }),
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$),
            map(
                ([[previous, current], render, transform]: [[MouseEvent, MouseEvent], RenderCamera, Transform]): number[] => {
                    const planeNormal = [0, 0, 1];
                    const planePoint = [0, 0, -2];

                    const currentIntersection = this._planeIntersection(
                        current,
                        planeNormal,
                        planePoint,
                        render.perspective,
                        this._container.container);

                    const previousIntersection = this._planeIntersection(
                        previous,
                        planeNormal,
                        planePoint,
                        render.perspective,
                        this._container.container);

                    if (!currentIntersection || !previousIntersection) {
                        return null;
                    }

                    const direction = new THREE.Vector3()
                        .subVectors(currentIntersection, previousIntersection)
                        .multiplyScalar(-1)
                        .toArray();

                    return direction;
                }),
            filter(
                (direction: number[]): boolean => {
                    return !!direction;
                }))
            .subscribe(
                (direction: number[]): void => {
                    this._navigator.stateService.truck(direction);
                }));

        subs.push(earth$.pipe(
            switchMap(
                (earth: boolean): Observable<[MouseEvent, MouseEvent]> => {
                    if (!earth) {
                        return observableEmpty();
                    }

                    return MouseOperator.filteredPairwiseMouseDrag$(this._component.name, this._container.mouseService).pipe(
                        filter(
                            ([e1, e2]: [MouseEvent, MouseEvent]): boolean => {
                                return e1.ctrlKey && e2.ctrlKey;
                            }));
                }),
            map(
                ([previous, current]: [MouseEvent, MouseEvent]): EulerRotation => {
                    return this._mousePairToRotation(previous, current);
                }))
            .subscribe(
                (rotation: EulerRotation): void => {
                    this._navigator.stateService.orbit(rotation);
                }));

        subs.push(earth$.pipe(
            switchMap(
                (earth: boolean): Observable<[MouseEvent, MouseEvent]> => {
                    if (!earth) {
                        return observableEmpty();
                    }

                    return MouseOperator.filteredPairwiseMouseRightDrag$(this._component.name, this._container.mouseService).pipe(
                        filter(
                            ([e1, e2]: [MouseEvent, MouseEvent]): boolean => {
                                return !e1.ctrlKey && !e2.ctrlKey;
                            }));
                }),
            map(
                ([previous, current]: [MouseEvent, MouseEvent]): EulerRotation => {
                    return this._mousePairToRotation(previous, current);
                }))
            .subscribe(
                (rotation: EulerRotation): void => {
                    this._navigator.stateService.orbit(rotation);
                }));

        subs.push(earth$.pipe(
            switchMap(
                (earth: boolean): Observable<WheelEvent> => {
                    if (!earth) {
                        return observableEmpty();
                    }

                    return this._container.mouseService
                        .filteredWheel$(this._component.name, this._container.mouseService.mouseWheel$);
                }),
            map(
                (event: WheelEvent): number => {
                    let delta = event.deltaY;

                    if (event.deltaMode === 1) {
                        delta = 40 * delta;
                    } else if (event.deltaMode === 2) {
                        delta = 800 * delta;
                    }

                    const canvasSize = this._viewportCoords.containerToCanvas(this._container.container);

                    return -delta / canvasSize[1];
                }))
            .subscribe(
                (delta: number): void => {
                    this._navigator.stateService.dolly(delta);
                }));
    }

    protected _disable(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getConfiguration(): PointerConfiguration {
        return {};
    }

    private _eventToViewport(event: MouseEvent, element: HTMLElement): number[] {
        const previousCanvas = this._viewportCoords.canvasPosition(event, element);

        return this._viewportCoords.canvasToViewport(previousCanvas[0], previousCanvas[1], element);
    }

    private _mousePairToRotation(
        previous: MouseEvent, current: MouseEvent): EulerRotation {
        const [currentX, currentY] =
            this._eventToViewport(current, this._container.container);
        const [previousX, previousY]: number[] =
            this._eventToViewport(previous, this._container.container);

        const phi = (previousX - currentX) * Math.PI;
        const theta = (currentY - previousY) * Math.PI / 2;

        return { phi: phi, theta: theta };
    }

    private _planeIntersection(
        event: MouseEvent,
        planeNormal: number[],
        planePoint: number[],
        camera: THREE.Camera,
        element: HTMLElement): THREE.Vector3 {

        const [canvasX, canvasY] = this._viewportCoords.canvasPosition(event, element);
        const direction: THREE.Vector3 =
            this._viewportCoords
                .unprojectFromCanvas(
                    canvasX,
                    canvasY,
                    element,
                    camera)
                .sub(camera.position)
                .normalize();

        if (Math.abs(this._spatial.angleToPlane(direction.toArray(), planeNormal)) < Math.PI / 90) {
            return null;
        }

        const l0 = camera.position.clone();
        const n = new THREE.Vector3().fromArray(planeNormal);
        const p0 = new THREE.Vector3().fromArray(planePoint);

        const d = new THREE.Vector3().subVectors(p0, l0).dot(n) / direction.clone().dot(n);

        const intersection = new THREE.Vector3().addVectors(l0, direction.multiplyScalar(d));

        if (this._viewportCoords.worldToCamera(intersection.toArray(), camera)[2] > 0) {
            return null;
        }

        return intersection;
    }
}
