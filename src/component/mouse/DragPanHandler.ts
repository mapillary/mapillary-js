import {
    concat as observableConcat,
    of as observableOf,
    empty as observableEmpty,
    merge as observableMerge,
    Observable,
    Subscription,
} from "rxjs";

import {
    sample,
    scan,
    map,
    share,
    switchMap,
    takeWhile,
    withLatestFrom,
    pairwise,
    filter,
    startWith,
    distinctUntilChanged,
} from "rxjs/operators";

import * as THREE from "three";

import {
    Component,
    IMouseConfiguration,
    HandlerBase,
    MouseTouchPair,
} from "../../Component";
import {
    Camera,
    Lines,
    Spatial,
    Transform,
    ViewportCoords,
} from "../../Geo";
import {
    RenderCamera,
} from "../../Render";
import {
    IFrame,
    IRotation,
} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";

/**
 * The `DragPanHandler` allows the user to pan the viewer image by clicking and dragging the cursor.
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
                .filtered$(this._component.name, this._container.mouseService.mouseDragStart$).pipe(
                map(
                    (event: MouseEvent): boolean => {
                        return true;
                    }),
                share());

        let draggingStopped$: Observable<boolean> =
             this._container.mouseService
                .filtered$(this._component.name, this._container.mouseService.mouseDragEnd$).pipe(
                map(
                    (event: Event): boolean => {
                        return false;
                    }),
                share());

        this._activeMouseSubscription = observableMerge(
                draggingStarted$,
                draggingStopped$)
            .subscribe(this._container.mouseService.activate$);

        const documentMouseMove$: Observable<MouseEvent> = observableMerge(
                draggingStarted$,
                draggingStopped$).pipe(
            switchMap(
                (dragging: boolean): Observable<MouseEvent> => {
                    return dragging ?
                        this._container.mouseService.documentMouseMove$ :
                        observableEmpty();
                }));

        this._preventDefaultSubscription = observableMerge(
                documentMouseMove$,
                this._container.touchService.touchMove$)
            .subscribe(
                (event: MouseEvent | TouchEvent): void => {
                    event.preventDefault(); // prevent selection of content outside the viewer
                });

        let touchMovingStarted$: Observable<boolean> =
            this._container.touchService.singleTouchDragStart$.pipe(
                map(
                    (event: TouchEvent): boolean => {
                        return true;
                    }));

        let touchMovingStopped$: Observable<boolean> =
            this._container.touchService.singleTouchDragEnd$.pipe(
                map(
                    (event: TouchEvent): boolean => {
                        return false;
                    }));

        this._activeTouchSubscription = observableMerge(
                touchMovingStarted$,
                touchMovingStopped$)
            .subscribe(this._container.touchService.activate$);

        const rotation$: Observable<IRotation> = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: IFrame): boolean => {
                    return frame.state.currentNode.fullPano || frame.state.nodesAhead < 1;
                }),
            distinctUntilChanged(),
            switchMap(
                (enable: boolean): Observable<MouseTouchPair> => {
                    if (!enable) {
                        return observableEmpty();
                    }

                    const mouseDrag$: Observable<[MouseEvent, MouseEvent]> = this._container.mouseService
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

                    const singleTouchDrag$: Observable<[Touch, Touch]> = observableMerge(
                            this._container.touchService.singleTouchDragStart$,
                            this._container.touchService.singleTouchDrag$,
                            this._container.touchService.singleTouchDragEnd$.pipe(
                                map((t: TouchEvent): TouchEvent => { return null; }))).pipe(
                        map(
                            (event: TouchEvent): Touch => {
                                return event != null && event.touches.length > 0 ?
                                    event.touches[0] : null;
                            }),
                        pairwise(),
                        filter(
                            (pair: [Touch, Touch]): boolean => {
                                return pair[0] != null && pair[1] != null;
                            }));

                    return observableMerge(
                            mouseDrag$,
                            singleTouchDrag$);
                }),
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$),
            map(
                ([events, render, transform]: [MouseTouchPair, RenderCamera, Transform]): IRotation => {
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

                    const boundaryPointsBasic: number[][] = this._basicBoundaryPoints(30);
                    const boundaryPointsViewport: number[][] = boundaryPointsBasic
                        .map(
                            (basic: number[]) => {
                                return this._viewportCoords.basicToViewportSafe(basic[0], basic[1], transform, render.perspective);
                            });

                    function _insideViewport(x: number, y: number): boolean {
                        return x >= -1 && x <= 1 && y >= -1 && y <= 1;
                    }

                    const visibleBoundaryPoints: number[][] = [];
                    const viewportSides: Lines.Point[] = [
                        { x: -1, y: 1 },
                        { x: 1, y: 1 },
                        { x: 1, y: -1 },
                        { x: -1, y: -1 }];

                    const intersections: boolean[] = [false, false, false, false];

                    for (let i: number = 0; i < boundaryPointsViewport.length; i++) {
                        const p1: number[] = boundaryPointsViewport[i];
                        const p2: number[] = boundaryPointsViewport[(i + 1) % boundaryPointsViewport.length];

                        if (p1 === null) {
                            continue;
                        }

                        if (p2 === null) {
                            if (_insideViewport(p1[0], p1[1])) {
                                visibleBoundaryPoints.push(p1);
                            }

                            continue;
                        }

                        const [x1, y1]: number[] = p1;
                        const [x2, y2]: number[] = p2;

                        if (_insideViewport(x1, y1)) {
                            if (_insideViewport(x2, y2)) {
                                visibleBoundaryPoints.push(p1);
                            } else {
                                for (let side: number = 0; side < 4; side++) {
                                    const s1: Lines.Segment = { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } };
                                    const s2: Lines.Segment = { p1: viewportSides[side], p2: viewportSides[(side + 1) % 4] };

                                    const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

                                    if (intersecting) {
                                        const intersection: Lines.Point = Lines.segmentIntersection(s1, s2);

                                        visibleBoundaryPoints.push(p1, [intersection.x, intersection.y]);
                                        intersections[side] = true;
                                    }
                                }
                            }
                        }
                    }

                    const [topLeftBasicX, topLeftBasicY]: number[] =
                        this._viewportCoords.viewportToBasic(-1, 1, transform, render.perspective);

                    const [topRightBasicX, topRightBasicY]: number[] =
                        this._viewportCoords.viewportToBasic(1, 1, transform, render.perspective);

                    const [bottomRightBasicX, bottomRightBasicY]: number[] =
                        this._viewportCoords.viewportToBasic(1, -1, transform, render.perspective);

                    const [bottomLeftBasicX, bottomLeftBasicY]: number[] =
                        this._viewportCoords.viewportToBasic(-1, -1, transform, render.perspective);

                    function _insideBasic(x: number, y: number): boolean {
                        return x >= 0 && x <= 1 && y >= 0 && y <= 1;
                    }

                    if (_insideBasic(topLeftBasicX, topLeftBasicY)) {
                        intersections[3] = intersections[0] = true;
                    }

                    if (_insideBasic(topRightBasicX, topRightBasicY)) {
                        intersections[0] = intersections[1] = true;
                    }

                    if (_insideBasic(bottomRightBasicX, bottomRightBasicY)) {
                        intersections[1] = intersections[2] = true;
                    }

                    if (_insideBasic(bottomLeftBasicX, bottomLeftBasicY)) {
                        intersections[2] = intersections[3] = true;
                    }

                    const maximums: number[] = [-1, -1, 1, 1];

                    for (let visibleBoundaryPoint of visibleBoundaryPoints) {
                        const x: number = visibleBoundaryPoint[0];
                        const y: number = visibleBoundaryPoint[1];

                        if (x > maximums[1]) {
                            maximums[1] = x;
                        }

                        if (x < maximums[3]) {
                            maximums[3] = x;
                        }

                        if (y > maximums[0]) {
                            maximums[0] = y;
                        }

                        if (y < maximums[2]) {
                            maximums[2] = y;
                        }
                    }

                    const boundary: number[] = [1, 1, -1, -1];
                    const distances: number[] = [];

                    for (let side: number = 0; side < 4; side++) {
                        if (intersections[side]) {
                            distances.push(0);
                            continue;
                        }

                        distances.push(Math.abs(boundary[side] - maximums[side]));
                    }

                    if (!intersections[0] && deltaTheta < 0) {
                        deltaTheta /= Math.max(1, 2e2 * distances[0]);
                    }

                    if (!intersections[2] && deltaTheta > 0) {
                        deltaTheta /= Math.max(1, 2e2 * distances[2]);
                    }

                    if (!intersections[1] && deltaPhi < 0) {
                        deltaPhi /= Math.max(1, 2e2 * distances[1]);
                    }

                    if (!intersections[3] && deltaPhi > 0) {
                        deltaPhi /= Math.max(1, 2e2 * distances[3]);
                    }

                    return { phi: deltaPhi, theta: deltaTheta };
                }),
            share());

        this._rotateBasicWithoutInertiaSubscription = rotation$
            .subscribe(
                (rotation: IRotation): void => {
                    this._navigator.stateService.rotateWithoutInertia(rotation);
                });

        this._rotateBasicSubscription = rotation$.pipe(
            scan(
                (rotationBuffer: [number, IRotation][], rotation: IRotation): [number, IRotation][] => {
                    this._drainBuffer(rotationBuffer);

                    rotationBuffer.push([Date.now(), rotation]);

                    return rotationBuffer;
                },
                []),
            sample(
                observableMerge(
                        this._container.mouseService.filtered$(
                            this._component.name,
                            this._container.mouseService.mouseDragEnd$),
                        this._container.touchService.singleTouchDragEnd$)),
            map(
                (rotationBuffer: [number, IRotation][]): IRotation => {
                    const drainedBuffer: [number, IRotation][] = this._drainBuffer(rotationBuffer.slice());
                    const rotation: IRotation = { phi: 0, theta: 0 };

                    for (const bufferedRotation of drainedBuffer) {
                        rotation.phi += bufferedRotation[1].phi;
                        rotation.theta += bufferedRotation[1].theta;
                    }

                    const count: number = drainedBuffer.length;
                    if (count > 0) {
                        rotation.phi /= count;
                        rotation.theta /= count;
                    }

                    return rotation;
                }))
            .subscribe(
                (rotation: IRotation): void => {
                    this._navigator.stateService.rotate(rotation);
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

    private _basicBoundaryPoints(pointsPerSide: number): number[][] {
        let points: number[][] = [];
        let os: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
        let ds: number[][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

        for (let side: number = 0; side < 4; ++side) {
            let o: number[] = os[side];
            let d: number[] = ds[side];

            for (let i: number = 0; i < pointsPerSide; ++i) {
                points.push([o[0] + d[0] * i / pointsPerSide,
                             o[1] + d[1] * i / pointsPerSide]);
            }
        }

        return points;
    }
}

export default DragPanHandler;
