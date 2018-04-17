import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/throttleTime";

import {ILatLon} from "../API";
import {
    ILatLonAlt,
    Transform,
} from "../Geo";
import {
    IEdgeStatus,
    Node,
} from "../Graph";
import {RenderCamera} from "../Render";
import {EventEmitter} from "../Utils";
import {
    Container,
    IUnprojection,
    IViewerMouseEvent,
    Navigator,
    Projection,
    Viewer,
} from "../Viewer";

export class Observer {
    private _started: boolean;

    private _navigable$: Subject<boolean>;

    private _bearingSubscription: Subscription;
    private _currentNodeSubscription: Subscription;
    private _moveSubscription: Subscription;
    private _sequenceEdgesSubscription: Subscription;
    private _spatialEdgesSubscription: Subscription;
    private _viewerMouseEventSubscription: Subscription;

    private _container: Container;
    private _eventEmitter: EventEmitter;
    private _navigator: Navigator;
    private _projection: Projection;

    constructor(eventEmitter: EventEmitter, navigator: Navigator, container: Container) {
        this._container = container;
        this._eventEmitter = eventEmitter;
        this._navigator = navigator;
        this._projection = new Projection();

        this._started = false;

        this._navigable$ = new Subject<boolean>();

        // navigable and loading should always emit, also when cover is activated.
        this._navigable$
            .subscribe(
                (navigable: boolean): void => {
                    this._eventEmitter.fire(Viewer.navigablechanged, navigable);
                });

        this._navigator.loadingService.loading$
            .subscribe(
                (loading: boolean): void => {
                    this._eventEmitter.fire(Viewer.loadingchanged, loading);
                });
    }

    public get started(): boolean {
        return this._started;
    }

    public get navigable$(): Subject<boolean> {
        return this._navigable$;
    }

    public projectBasic$(basicPoint: number[]): Observable<number[]> {
        return Observable
            .combineLatest(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
            .first()
            .map(
                ([render, transform]: [RenderCamera, Transform]): number[] => {
                    const canvasPoint: number[] = this._projection.basicToCanvas(
                        basicPoint,
                        this._container.element,
                        render,
                        transform);

                    return [Math.round(canvasPoint[0]), Math.round(canvasPoint[1])];
                });
    }

    public startEmit(): void {
        if (this._started) {
            return;
        }

        this._started = true;

        this._currentNodeSubscription = this._navigator.stateService.currentNodeExternal$
            .subscribe((node: Node): void => {
                this._eventEmitter.fire(Viewer.nodechanged, node);
            });

        this._sequenceEdgesSubscription = this._navigator.stateService.currentNodeExternal$
            .switchMap(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.sequenceEdges$;
                })
            .subscribe(
                (status: IEdgeStatus): void => {
                    this._eventEmitter.fire(Viewer.sequenceedgeschanged, status);
                });

        this._spatialEdgesSubscription = this._navigator.stateService.currentNodeExternal$
            .switchMap(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.spatialEdges$;
                })
            .subscribe(
                (status: IEdgeStatus): void => {
                    this._eventEmitter.fire(Viewer.spatialedgeschanged, status);
                });

        this._moveSubscription = Observable
            .combineLatest(
                this._navigator.stateService.inMotion$,
                this._container.mouseService.active$,
                this._container.touchService.active$)
            .map(
                (values: boolean[]): boolean => {
                    return values[0] || values[1] || values[2];
                })
            .distinctUntilChanged()
            .subscribe(
                (started: boolean) => {
                    if (started) {
                        this._eventEmitter.fire(Viewer.movestart, null);
                    } else {
                        this._eventEmitter.fire(Viewer.moveend, null);
                    }
                });

        this._bearingSubscription = this._container.renderService.bearing$
            .auditTime(100)
            .distinctUntilChanged(
                (b1: number, b2: number): boolean => {
                    return Math.abs(b2 - b1) < 1;
                })
            .subscribe(
                (bearing): void => {
                    this._eventEmitter.fire(Viewer.bearingchanged, bearing);
                 });

        const mouseMove$: Observable<MouseEvent> = this._container.mouseService.active$
            .switchMap(
                (active: boolean): Observable<MouseEvent> => {
                    return active ?
                        Observable.empty<MouseEvent>() :
                        this._container.mouseService.mouseMove$;
                });

        this._viewerMouseEventSubscription = Observable
            .merge(
                this._mapMouseEvent$(Viewer.click, this._container.mouseService.staticClick$),
                this._mapMouseEvent$(Viewer.contextmenu, this._container.mouseService.contextMenu$),
                this._mapMouseEvent$(Viewer.dblclick, this._container.mouseService.dblClick$),
                this._mapMouseEvent$(Viewer.mousedown, this._container.mouseService.mouseDown$),
                this._mapMouseEvent$(Viewer.mousemove, mouseMove$),
                this._mapMouseEvent$(Viewer.mouseout, this._container.mouseService.mouseOut$),
                this._mapMouseEvent$(Viewer.mouseover, this._container.mouseService.mouseOver$),
                this._mapMouseEvent$(Viewer.mouseup, this._container.mouseService.mouseUp$))
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.reference$,
                this._navigator.stateService.currentTransform$)
            .map(
                ([[type, event], render, reference, transform]:
                [[string, MouseEvent], RenderCamera, ILatLonAlt, Transform]): IViewerMouseEvent => {
                    const unprojection: IUnprojection =
                        this._projection.eventToUnprojection(
                            event,
                            this._container.element,
                            render,
                            reference,
                            transform);

                    return  {
                        basicPoint: unprojection.basicPoint,
                        latLon: unprojection.latLon,
                        originalEvent: event,
                        pixelPoint: unprojection.pixelPoint,
                        target: <Viewer>this._eventEmitter,
                        type: type,
                    };
                })
            .subscribe(
                (event: IViewerMouseEvent): void => {
                    this._eventEmitter.fire(event.type, event);
                });
    }

    public stopEmit(): void {
        if (!this.started) {
            return;
        }

        this._started = false;

        this._bearingSubscription.unsubscribe();
        this._currentNodeSubscription.unsubscribe();
        this._moveSubscription.unsubscribe();
        this._sequenceEdgesSubscription.unsubscribe();
        this._spatialEdgesSubscription.unsubscribe();
        this._viewerMouseEventSubscription.unsubscribe();

        this._bearingSubscription = null;
        this._currentNodeSubscription = null;
        this._moveSubscription = null;
        this._sequenceEdgesSubscription = null;
        this._spatialEdgesSubscription = null;
        this._viewerMouseEventSubscription = null;
    }

    public unproject$(canvasPoint: number[]): Observable<ILatLon> {
        return Observable
            .combineLatest(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.reference$,
                this._navigator.stateService.currentTransform$)
            .first()
            .map(
                ([render, reference, transform]: [RenderCamera, ILatLonAlt, Transform]): ILatLon => {
                    const unprojection: IUnprojection =
                        this._projection.canvasToUnprojection(
                            canvasPoint,
                            this._container.element,
                            render,
                            reference,
                            transform);

                    return unprojection.latLon;
                });
    }

    public unprojectBasic$(canvasPoint: number[]): Observable<number[]> {
        return Observable
            .combineLatest(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
            .first()
            .map(
                ([render, transform]: [RenderCamera, Transform]): number[] => {
                    return this._projection.canvasToBasic(
                        canvasPoint,
                        this._container.element,
                        render,
                        transform);
                });
    }

    private _mapMouseEvent$(type: string, mouseEvent$: Observable<MouseEvent>): Observable<[string, MouseEvent]> {
        return mouseEvent$.map(
            (event: MouseEvent): [string, MouseEvent] => {
                return [type, event];
            });
    }
}

export default Observer;
