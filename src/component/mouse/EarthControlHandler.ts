import * as THREE from "three";

import {
    combineLatest as observableCombinLatest,
    empty as observableEmpty,
    merge as observableMerge,
    of as observableOf,
    Subscription,
    Observable,
} from "rxjs";

import {
    map,
    filter,
    withLatestFrom,
    share,
    switchMap,
    startWith,
    distinctUntilChanged,
} from "rxjs/operators";

import {
    Component,
    IMouseConfiguration,
    HandlerBase,
    MouseOperator,
} from "../../Component";
import {
    Spatial,
    Transform,
    ViewportCoords,
} from "../../Geo";
import {
    RenderCamera,
} from "../../Render";
import {
    IRotation,
    State,
} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";

export class EarthControlHandler extends HandlerBase<IMouseConfiguration> {
    private _viewportCoords: ViewportCoords;
    private _spatial: Spatial;

    private _dollySubscription: Subscription;
    private _orbitSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _truckSubscription: Subscription;

    constructor(
        component: Component<IMouseConfiguration>,
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

        this._orbitSubscription = earth$.pipe(
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
                ([previous, current]: [MouseEvent, MouseEvent]): IRotation => {
                    const [currentX, currentY]: number[] = this._eventToViewport(current, this._container.container);
                    const [previousX, previousY]: number[] = this._eventToViewport(previous, this._container.container);

                    const phi: number = (previousX - currentX) * Math.PI;
                    const theta: number = (currentY - previousY) * Math.PI / 2;

                    return { phi: phi, theta: theta };
                }))
            .subscribe(
                (rotation: IRotation): void => {
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
        this._orbitSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._truckSubscription.unsubscribe();
    }

    protected _getConfiguration(): IMouseConfiguration {
        return {};
    }

    private _eventToViewport(event: MouseEvent, element: HTMLElement): number[] {
        const previousCanvas: number[] = this._viewportCoords.canvasPosition(event, element);

        return this._viewportCoords.canvasToViewport(previousCanvas[0], previousCanvas[1], element);
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

export default EarthControlHandler;
