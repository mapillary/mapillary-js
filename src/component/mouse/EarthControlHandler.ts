import * as THREE from "three";

import {
    empty as observableEmpty,
    Subscription,
    Observable,
} from "rxjs";

import {
    map,
    filter,
    withLatestFrom,
    share,
    switchMap,
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
import { MouseConfiguration } from "../interfaces/MouseConfiguration";
import { HandlerBase } from "../utils/HandlerBase";
import { MouseOperator } from "../utils/MouseOperator";


export class EarthControlHandler extends HandlerBase<MouseConfiguration> {
    private _viewportCoords: ViewportCoords;
    private _spatial: Spatial;

    private _dollySubscription: Subscription;
    private _ctrlOrbitSubscription: Subscription;
    private _rightOrbitSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _truckSubscription: Subscription;

    /** @ignore */
    constructor(
        component: Component<MouseConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords,
        spatial: Spatial) {
        super(component, container, navigator);

        this._spatial = spatial;
        this._viewportCoords = viewportCoords;
    }

    protected _enable(): void {
        const earth$: Observable<boolean> = this._navigator.stateService.state$.pipe(
            map(
                (state: State): boolean => {
                    return state === State.Earth;
                }),
            share());

        this._preventDefaultSubscription = earth$.pipe(
            switchMap(
                (earth: boolean): Observable<MouseEvent> => {
                    return earth ?
                        this._container.mouseService.mouseWheel$ :
                        observableEmpty();
                }))
            .subscribe(
                (event: WheelEvent): void => {
                    event.preventDefault();
                });

        this._truckSubscription = earth$.pipe(
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
                    const planeNormal: number[] = [0, 0, 1];
                    const planePoint: number[] = transform.unprojectBasic([0.5, 0.5], 0);
                    planePoint[2] -= 2;

                    const currentIntersection: THREE.Vector3 = this._planeIntersection(
                        current,
                        planeNormal,
                        planePoint,
                        render.perspective,
                        this._container.container);

                    const previousIntersection: THREE.Vector3 = this._planeIntersection(
                        previous,
                        planeNormal,
                        planePoint,
                        render.perspective,
                        this._container.container);

                    if (!currentIntersection || !previousIntersection) {
                        return null;
                    }

                    const direction: number[] = new THREE.Vector3()
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
                });

        this._ctrlOrbitSubscription = earth$.pipe(
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
                });

        this._rightOrbitSubscription = earth$.pipe(
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
                });

        this._dollySubscription = earth$.pipe(
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
                    let delta: number = event.deltaY;

                    if (event.deltaMode === 1) {
                        delta = 40 * delta;
                    } else if (event.deltaMode === 2) {
                        delta = 800 * delta;
                    }

                    const canvasSize: number[] = this._viewportCoords.containerToCanvas(this._container.container);

                    return -delta / canvasSize[1];
                }))
            .subscribe(
                (delta: number): void => {
                    this._navigator.stateService.dolly(delta);
                });
    }

    protected _disable(): void {
        this._dollySubscription.unsubscribe();
        this._ctrlOrbitSubscription.unsubscribe();
        this._rightOrbitSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._truckSubscription.unsubscribe();
    }

    protected _getConfiguration(): MouseConfiguration {
        return {};
    }

    private _eventToViewport(event: MouseEvent, element: HTMLElement): number[] {
        const previousCanvas: number[] = this._viewportCoords.canvasPosition(event, element);

        return this._viewportCoords.canvasToViewport(previousCanvas[0], previousCanvas[1], element);
    }

    private _mousePairToRotation(
        previous: MouseEvent, current: MouseEvent): EulerRotation {
        const [currentX, currentY] =
            this._eventToViewport(current, this._container.container);
        const [previousX, previousY]: number[] =
            this._eventToViewport(previous, this._container.container);

        const phi: number = (previousX - currentX) * Math.PI;
        const theta: number = (currentY - previousY) * Math.PI / 2;

        return { phi: phi, theta: theta };
    }

    private _planeIntersection(
        event: MouseEvent,
        planeNormal: number[],
        planePoint: number[],
        camera: THREE.Camera,
        element: HTMLElement): THREE.Vector3 {

        const [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);
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

        const l0: THREE.Vector3 = camera.position.clone();
        const n: THREE.Vector3 = new THREE.Vector3().fromArray(planeNormal);
        const p0: THREE.Vector3 = new THREE.Vector3().fromArray(planePoint);

        const d: number = new THREE.Vector3().subVectors(p0, l0).dot(n) / direction.clone().dot(n);

        const intersection: THREE.Vector3 = new THREE.Vector3().addVectors(l0, direction.multiplyScalar(d));

        if (this._viewportCoords.worldToCamera(intersection.toArray(), camera)[2] > 0) {
            return null;
        }

        return intersection;
    }
}
