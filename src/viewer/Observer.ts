import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    merge as observableMerge,
    Observable,
    Subject,
} from "rxjs";

import {
    auditTime,
    distinctUntilChanged,
    first,
    map,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import { Container } from "./Container";
import { Navigator } from "./Navigator";
import { Projection } from "./Projection";
import { Unprojection } from "./interfaces/Unprojection";
import { ViewerMouseEvent } from "./events/ViewerMouseEvent";

import { LngLat } from "../api/interfaces/LngLat";
import { Transform } from "../geo/Transform";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { Image } from "../graph/Image";
import { NavigationEdgeStatus } from "../graph/interfaces/NavigationEdgeStatus";
import { RenderCamera } from "../render/RenderCamera";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { ViewerEventType } from "./events/ViewerEventType";
import { IViewer } from "./interfaces/IViewer";
import { ViewerNavigableEvent } from "./events/ViewerNavigableEvent";
import { ViewerDataLoadingEvent } from "./events/ViewerDataLoadingEvent";
import { ViewerImageEvent } from "./events/ViewerImageEvent";
import { ViewerNavigationEdgeEvent } from "./events/ViewerNavigationEdgeEvent";
import { ViewerStateEvent } from "./events/ViewerStateEvent";
import { ViewerBearingEvent } from "./events/ViewerBearingEvent";
import { State } from "../state/State";
import { ViewerLoadEvent } from "./events/ViewerLoadEvent";
import { ViewerReferenceEvent } from "./events/ViewerReferenceEvent";

type UnprojectionParams = [
    [
        ViewerMouseEvent['type'],
        MouseEvent,
    ],
    RenderCamera,
    LngLatAlt,
    Transform,
    State,
];

export class Observer {
    private _started: boolean;

    private _navigable$: Subject<boolean>;

    private _subscriptions: SubscriptionHolder =
        new SubscriptionHolder();
    private _emitSubscriptions: SubscriptionHolder =
        new SubscriptionHolder();

    private _container: Container;
    private _viewer: IViewer;
    private _navigator: Navigator;
    private _projection: Projection;

    constructor(
        viewer: IViewer,
        navigator: Navigator,
        container: Container) {
        this._container = container;
        this._viewer = viewer;
        this._navigator = navigator;
        this._projection = new Projection();

        this._started = false;

        this._navigable$ = new Subject<boolean>();

        const subs = this._subscriptions;

        // load, navigable, dataloading should always emit,
        // also when cover is activated.
        subs.push(this._navigable$
            .subscribe(
                (navigable: boolean): void => {
                    const type: ViewerEventType = "navigable";
                    const event: ViewerNavigableEvent = {
                        navigable,
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));

        subs.push(this._navigator.loadingService.loading$
            .subscribe(
                (loading: boolean): void => {
                    const type: ViewerEventType = "dataloading";
                    const event: ViewerDataLoadingEvent = {
                        loading,
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));

        subs.push(this._container.glRenderer.opaqueRender$
            .pipe(first())
            .subscribe(
                (): void => {
                    const type: ViewerEventType = "load";
                    const event: ViewerLoadEvent = {
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));
    }

    public get started(): boolean {
        return this._started;
    }

    public get navigable$(): Subject<boolean> {
        return this._navigable$;
    }

    public get projection(): Projection {
        return this._projection;
    }

    public dispose(): void {
        this.stopEmit();
        this._subscriptions.unsubscribe();
    }

    public project$(
        lngLat: LngLat)
        : Observable<number[]> {
        return observableCombineLatest(
            this._container.renderService.renderCamera$,
            this._navigator.stateService.currentImage$,
            this._navigator.stateService.reference$).pipe(
                first(),
                map(
                    ([render, image, reference]: [RenderCamera, Image, LngLatAlt]): number[] => {
                        if (this._projection
                            .distanceBetweenLngLats(
                                lngLat,
                                image.lngLat) > 1000) {
                            return null;
                        }

                        const canvasPoint: number[] =
                            this._projection.lngLatToCanvas(
                                lngLat,
                                this._container.container,
                                render,
                                reference);

                        return !!canvasPoint ?
                            [Math.round(canvasPoint[0]), Math.round(canvasPoint[1])] :
                            null;
                    }));
    }

    public projectBasic$(
        basicPoint: number[])
        : Observable<number[]> {
        return observableCombineLatest(
            this._container.renderService.renderCamera$,
            this._navigator.stateService.currentTransform$).pipe(
                first(),
                map(
                    ([render, transform]: [RenderCamera, Transform]): number[] => {
                        const canvasPoint: number[] = this._projection.basicToCanvas(
                            basicPoint,
                            this._container.container,
                            render,
                            transform);

                        return !!canvasPoint ?
                            [Math.round(canvasPoint[0]), Math.round(canvasPoint[1])] :
                            null;
                    }));
    }

    public startEmit(): void {
        if (this._started) { return; }

        this._started = true;
        const subs = this._emitSubscriptions;

        subs.push(this._navigator.stateService.currentImageExternal$
            .subscribe((image: Image): void => {
                const type: ViewerEventType = "image";
                const event: ViewerImageEvent = {
                    image,
                    target: this._viewer,
                    type,
                };
                this._viewer.fire(type, event);
            }));

        subs.push(this._navigator.stateService.currentImageExternal$.pipe(
            switchMap(
                (image: Image): Observable<NavigationEdgeStatus> => {
                    return image.sequenceEdges$;
                }))
            .subscribe(
                (status: NavigationEdgeStatus): void => {
                    const type: ViewerEventType = "sequenceedges";
                    const event: ViewerNavigationEdgeEvent = {
                        status,
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));

        subs.push(this._navigator.stateService.currentImageExternal$.pipe(
            switchMap(
                (image: Image): Observable<NavigationEdgeStatus> => {
                    return image.spatialEdges$;
                }))
            .subscribe(
                (status: NavigationEdgeStatus): void => {
                    const type: ViewerEventType = "spatialedges";
                    const event: ViewerNavigationEdgeEvent = {
                        status,
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));

        subs.push(this._navigator.stateService.reference$
            .subscribe((reference: LngLatAlt): void => {
                const type: ViewerEventType = "reference";
                const event: ViewerReferenceEvent = {
                    reference,
                    target: this._viewer,
                    type,
                };
                this._viewer.fire(type, event);
            }));

        subs.push(observableCombineLatest(
            this._navigator.stateService.inMotion$,
            this._container.mouseService.active$,
            this._container.touchService.active$).pipe(
                map(
                    (values: boolean[]): boolean => {
                        return values[0] || values[1] || values[2];
                    }),
                distinctUntilChanged())
            .subscribe(
                (started: boolean) => {
                    const type: ViewerEventType = started ? "movestart" : "moveend";
                    const event: ViewerStateEvent = {
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));

        subs.push(this._container.renderService.bearing$.pipe(
            auditTime(100),
            distinctUntilChanged(
                (b1: number, b2: number): boolean => {
                    return Math.abs(b2 - b1) < 1;
                }))
            .subscribe(
                (bearing): void => {
                    const type: ViewerEventType = "bearing";
                    const event: ViewerBearingEvent = {
                        bearing,
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));

        const mouseMove$ = this._container.mouseService.active$.pipe(
            switchMap(
                (active: boolean): Observable<MouseEvent> => {
                    return active ?
                        observableEmpty() :
                        this._container.mouseService.mouseMove$;
                }));

        subs.push(observableMerge(
            this._mapMouseEvent$(
                "click",
                this._container.mouseService.staticClick$),
            this._mapMouseEvent$(
                "contextmenu",
                this._container.mouseService.contextMenu$),
            this._mapMouseEvent$(
                "dblclick",
                this._container.mouseService.dblClick$),
            this._mapMouseEvent$(
                "mousedown",
                this._container.mouseService.mouseDown$),
            this._mapMouseEvent$(
                "mousemove",
                mouseMove$),
            this._mapMouseEvent$(
                "mouseout",
                this._container.mouseService.mouseOut$),
            this._mapMouseEvent$(
                "mouseover",
                this._container.mouseService.mouseOver$),
            this._mapMouseEvent$(
                "mouseup",
                this._container.mouseService.mouseUp$))
            .pipe(
                withLatestFrom(
                    this._container.renderService.renderCamera$,
                    this._navigator.stateService.reference$,
                    this._navigator.stateService.currentTransform$,
                    this._navigator.stateService.state$),
                map(
                    ([[type, event], render, reference, transform, state]
                        : UnprojectionParams)
                        : ViewerMouseEvent => {
                        const unprojection: Unprojection =
                            this._projection.eventToUnprojection(
                                event,
                                this._container.container,
                                render,
                                reference,
                                transform);

                        const basicPoint = state === State.Traversing ?
                            unprojection.basicPoint : null;

                        return {
                            basicPoint,
                            lngLat: unprojection.lngLat,
                            originalEvent: event,
                            pixelPoint: unprojection.pixelPoint,
                            target: this._viewer,
                            type: type,
                        };
                    }))
            .subscribe(
                (event: ViewerMouseEvent): void => {
                    this._viewer.fire(event.type, event);
                }));

        subs.push(this._container.renderService.renderCamera$.pipe(
            distinctUntilChanged(
                ([x1, y1], [x2, y2]): boolean => {
                    return this._closeTo(x1, x2, 1e-2) &&
                        this._closeTo(y1, y2, 1e-2);
                },
                (rc: RenderCamera): number[] => {
                    return rc.camera.position.toArray();
                }))
            .subscribe(
                (): void => {
                    const type: ViewerEventType = "position";
                    const event: ViewerStateEvent = {
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));

        subs.push(this._container.renderService.renderCamera$.pipe(
            distinctUntilChanged(
                ([phi1, theta1], [phi2, theta2]): boolean => {
                    return this._closeTo(phi1, phi2, 1e-3) &&
                        this._closeTo(theta1, theta2, 1e-3);
                },
                (rc: RenderCamera): [number, number] => {
                    return [rc.rotation.phi, rc.rotation.theta];
                }))
            .subscribe(
                (): void => {
                    const type: ViewerEventType = "pov";
                    const event: ViewerStateEvent = {
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));

        subs.push(this._container.renderService.renderCamera$.pipe(
            distinctUntilChanged(
                (fov1, fov2): boolean => {
                    return this._closeTo(fov1, fov2, 1e-2);
                },
                (rc: RenderCamera): number => {
                    return rc.perspective.fov;
                }))
            .subscribe(
                (): void => {
                    const type: ViewerEventType = "fov";
                    const event: ViewerStateEvent = {
                        target: this._viewer,
                        type,
                    };
                    this._viewer.fire(type, event);
                }));
    }

    public stopEmit(): void {
        if (!this.started) { return; }

        this._emitSubscriptions.unsubscribe();
        this._started = false;
    }

    public unproject$(canvasPoint: number[]): Observable<LngLat> {
        return observableCombineLatest(
            this._container.renderService.renderCamera$,
            this._navigator.stateService.reference$,
            this._navigator.stateService.currentTransform$).pipe(
                first(),
                map(
                    ([render, reference, transform]: [RenderCamera, LngLatAlt, Transform]): LngLat => {
                        const unprojection: Unprojection =
                            this._projection.canvasToUnprojection(
                                canvasPoint,
                                this._container.container,
                                render,
                                reference,
                                transform);

                        return unprojection.lngLat;
                    }));
    }

    public unprojectBasic$(canvasPoint: number[]): Observable<number[]> {
        return observableCombineLatest(
            this._container.renderService.renderCamera$,
            this._navigator.stateService.currentTransform$).pipe(
                first(),
                map(
                    ([render, transform]: [RenderCamera, Transform]): number[] => {
                        return this._projection.canvasToBasic(
                            canvasPoint,
                            this._container.container,
                            render,
                            transform);
                    }));
    }

    private _closeTo(
        v1: number,
        v2: number,
        absoluteTolerance: number)
        : boolean {
        return Math.abs(v1 - v2) <= absoluteTolerance;
    }

    private _mapMouseEvent$(
        type: ViewerEventType,
        mouseEvent$: Observable<MouseEvent>)
        : Observable<[ViewerEventType, MouseEvent]> {
        return mouseEvent$.pipe(
            map(
                (event: MouseEvent): [ViewerEventType, MouseEvent] => {
                    return [type, event];
                }));
    }
}
