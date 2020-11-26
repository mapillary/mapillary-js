import {
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
    withLatestFrom,
    pairwise,
    filter,
    distinctUntilChanged,
    startWith,
} from "rxjs/operators";

import * as THREE from "three";

import {
    Component,
    ImageBoundary,
    IMouseConfiguration,
    HandlerBase,
    MouseTouchPair,
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
    IFrame,
    IRotation,
} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";
import Node from "../../graph/Node";

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

    private _activeMouseSubscription: Subscription;
    private _activeTouchSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _rotateSubscription: Subscription;
    private _rotateWithoutInertiaSubscription: Subscription;

    /** @ignore */
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
        let draggingStarted$: Observable<boolean> =
            this._container.mouseService
                .filtered$(this._component.name, this._container.mouseService.mouseDragStart$).pipe(
                    map(
                        (): boolean => {
                            return true;
                        }),
                    share());

        let draggingStopped$: Observable<boolean> =
            this._container.mouseService
                .filtered$(this._component.name, this._container.mouseService.mouseDragEnd$).pipe(
                    map(
                        (): boolean => {
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
                    (): boolean => {
                        return true;
                    }));

        let touchMovingStopped$: Observable<boolean> =
            this._container.touchService.singleTouchDragEnd$.pipe(
                map(
                    (): boolean => {
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

                    const mouseDrag$: Observable<[MouseEvent, MouseEvent]> =
                        MouseOperator.filteredPairwiseMouseDrag$(this._component.name, this._container.mouseService);

                    const singleTouchDrag$: Observable<[Touch, Touch]> = observableMerge(
                        this._container.touchService.singleTouchDragStart$,
                        this._container.touchService.singleTouchDrag$,
                        this._container.touchService.singleTouchDragEnd$.pipe(
                            map((): TouchEvent => { return null; }))).pipe(
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
                this._navigator.stateService.currentTransform$,
                this._navigator.panService.panNodes$),
            map(
                ([events, render, transform, nts]: [MouseTouchPair, RenderCamera, Transform, [Node, Transform, number][]]): IRotation => {
                    let previousEvent: MouseEvent | Touch = events[0];
                    let event: MouseEvent | Touch = events[1];

                    let movementX: number = event.clientX - previousEvent.clientX;
                    let movementY: number = event.clientY - previousEvent.clientY;

                    let element: HTMLElement = this._container.container;

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

                    let phi: number = (movementX > 0 ? 1 : -1) * directionX.angleTo(currentDirection);
                    let theta: number = (movementY > 0 ? -1 : 1) * directionY.angleTo(currentDirection);

                    const distances: number[] = ImageBoundary.viewportDistances(transform, render.perspective, this._viewportCoords);

                    for (const [, t] of nts) {
                        const d: number[] = ImageBoundary.viewportDistances(t, render.perspective, this._viewportCoords);

                        for (let i: number = 0; i < distances.length; i++) {
                            if (d[i] < distances[i]) {
                                distances[i] = d[i];
                            }
                        }
                    }

                    if (distances[0] > 0 && theta < 0) {
                        theta /= Math.max(1, 2e2 * distances[0]);
                    }

                    if (distances[2] > 0 && theta > 0) {
                        theta /= Math.max(1, 2e2 * distances[2]);
                    }

                    if (distances[1] > 0 && phi < 0) {
                        phi /= Math.max(1, 2e2 * distances[1]);
                    }

                    if (distances[3] > 0 && phi > 0) {
                        phi /= Math.max(1, 2e2 * distances[3]);
                    }

                    return { phi: phi, theta: theta };
                }),
            share());

        this._rotateWithoutInertiaSubscription = rotation$
            .subscribe(
                (rotation: IRotation): void => {
                    this._navigator.stateService.rotateWithoutInertia(rotation);
                });

        this._rotateSubscription = rotation$.pipe(
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

                    const threshold: number = Math.PI / 18;

                    rotation.phi = this._spatial.clamp(rotation.phi, -threshold, threshold);
                    rotation.theta = this._spatial.clamp(rotation.theta, -threshold, threshold);

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
        this._rotateSubscription.unsubscribe();
        this._rotateWithoutInertiaSubscription.unsubscribe();

        this._activeMouseSubscription = null;
        this._activeTouchSubscription = null;
        this._preventDefaultSubscription = null;
        this._rotateSubscription = null;
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
