import * as THREE from "three";

import {
    concat as observableConcat,
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
    pairwise,
    startWith,
    takeWhile,
    distinctUntilChanged,
} from "rxjs/operators";

import {
    Component,
    IMouseConfiguration,
    HandlerBase,
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

        const control$: Observable<boolean> = observableMerge(
            this._container.keyboardService.keyDown$.pipe(
                switchMap(
                    (event: KeyboardEvent): Observable<boolean> => {
                        return event.ctrlKey ?
                            observableOf(true) :
                            observableEmpty();
                    })),
            this._container.keyboardService.keyUp$.pipe(
                switchMap(
                    (event: KeyboardEvent): Observable<boolean> => {
                        return !event.ctrlKey ?
                            observableOf(false) :
                            observableEmpty();
                    }))).pipe(
            startWith(false),
            distinctUntilChanged());

        this._truckSubscription = observableCombinLatest(earth$, control$).pipe(
            switchMap(
                ([earth, control]: [boolean, boolean]): Observable<[MouseEvent, MouseEvent]> => {
                    if (!earth || control) {
                        return observableEmpty();
                    }

                    return this._container.mouseService
                        .filtered$(this._component.name, this._container.mouseService.mouseDragStart$).pipe(
                        switchMap(
                            (mouseDragStart: MouseEvent): Observable<MouseEvent> => {
                                const mouseDragging$: Observable<MouseEvent> = observableConcat(
                                    observableOf(mouseDragStart),
                                    this._container.mouseService
                                        .filtered$(this._component.name, this._container.mouseService.mouseDrag$));

                                const mouseDragEnd$: Observable<MouseEvent> = this._container.mouseService
                                    .filtered$(this._component.name, this._container.mouseService.mouseDragEnd$).pipe(
                                    map(
                                        (e: Event): MouseEvent => {
                                            return null;
                                        }));

                                return observableMerge(mouseDragging$, mouseDragEnd$).pipe(
                                    takeWhile(
                                        (e: MouseEvent): boolean => {
                                            return !!e;
                                        }),
                                    startWith(null));
                            }),
                        pairwise(),
                        filter(
                            (pair: [MouseEvent, MouseEvent]): boolean => {
                                return pair[0] != null && pair[1] != null;
                            }));
                }),
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$),
            map(
                ([[previous, current], render, transform]: [[MouseEvent, MouseEvent], RenderCamera, Transform]): number[] => {
                    const element: HTMLElement = this._container.element;

                    const [currentX, currentY]: number[] = this._viewportCoords.canvasPosition(current, element);
                    const currentDirection: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            currentX,
                            currentY,
                            element,
                            render.perspective)
                                .sub(render.perspective.position)
                                .normalize();

                    const [previousX, previousY]: number[] = this._viewportCoords.canvasPosition(previous, element);
                    const previousDirection: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            previousX,
                            previousY,
                            element,
                            render.perspective)
                                .sub(render.perspective.position)
                                .normalize();

                    const n: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

                    if (Math.abs(this._spatial.angleToPlane(currentDirection.toArray(), n.toArray())) < Math.PI / 90 ||
                        Math.abs(this._spatial.angleToPlane(previousDirection.toArray(), n.toArray())) < Math.PI / 90) {
                        return [0, 0, 0];
                    }

                    const p0: THREE.Vector3 = new THREE.Vector3().fromArray(transform.unprojectBasic([0.5, 0.5], 0));
                    p0.z -= 2;

                    const l0: THREE.Vector3 = render.perspective.position.clone();

                    const currentD: number = p0.clone().sub(l0).dot(n) / currentDirection.clone().dot(n);
                    const previousD: number = p0.clone().sub(l0).dot(n) / previousDirection.clone().dot(n);

                    const currentIntersection: THREE.Vector3 = l0.clone().add(currentDirection.multiplyScalar(currentD));
                    const previousIntersection: THREE.Vector3 = l0.clone().add(previousDirection.multiplyScalar(previousD));

                    if (this._viewportCoords.worldToCamera(currentIntersection.toArray(), render.perspective)[2] > 0 ||
                        this._viewportCoords.worldToCamera(previousIntersection.toArray(), render.perspective)[2] > 0) {
                        return [0, 0, 0];
                    }

                    const direction: number[] = currentIntersection.clone().sub(previousIntersection).multiplyScalar(-1).toArray();

                    return direction;
                }))
            .subscribe(
                (direction: number[]): void => {
                    this._navigator.stateService.truck(direction);
                });

        this._orbitSubscription = observableCombinLatest(earth$, control$).pipe(
            switchMap(
                ([earth, control]: [boolean, boolean]): Observable<[MouseEvent, MouseEvent]> => {
                    if (!(earth && control)) {
                        return observableEmpty();
                    }

                    return this._container.mouseService
                        .filtered$(this._component.name, this._container.mouseService.mouseDragStart$).pipe(
                        switchMap(
                            (mouseDragStart: MouseEvent): Observable<MouseEvent> => {
                                const mouseDragging$: Observable<MouseEvent> = observableConcat(
                                    observableOf(mouseDragStart),
                                    this._container.mouseService
                                        .filtered$(this._component.name, this._container.mouseService.mouseDrag$));

                                const mouseDragEnd$: Observable<MouseEvent> = this._container.mouseService
                                    .filtered$(this._component.name, this._container.mouseService.mouseDragEnd$).pipe(
                                    map(
                                        (e: Event): MouseEvent => {
                                            return null;
                                        }));

                                return observableMerge(mouseDragging$, mouseDragEnd$).pipe(
                                    takeWhile(
                                        (e: MouseEvent): boolean => {
                                            return !!e;
                                        }),
                                    startWith(null));
                            }),
                        pairwise(),
                        filter(
                            (pair: [MouseEvent, MouseEvent]): boolean => {
                                return pair[0] != null && pair[1] != null;
                            }));
                }),
            map(
                ([previous, current]: [MouseEvent, MouseEvent]): IRotation => {
                    const element: HTMLElement = this._container.element;

                    const currentCanvas: number[] = this._viewportCoords.canvasPosition(current, element);
                    const [currentX, currentY]: number[] =
                        this._viewportCoords.canvasToViewport(currentCanvas[0], currentCanvas[1], element);

                    const previousCanvas: number[] = this._viewportCoords.canvasPosition(previous, element);
                    const [previousX, previousY]: number[] =
                        this._viewportCoords.canvasToViewport(previousCanvas[0], previousCanvas[1], element);

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

                    const canvasSize: number[] = this._viewportCoords.containerToCanvas(this._container.element);

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
        return { };
    }
}

export default EarthControlHandler;
