/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/throttleTime";

import {ILatLon} from "../API";
import {
    GeoCoords,
    ILatLonAlt,
    Transform,
    ViewportCoords,
} from "../Geo";
import {
    IEdgeStatus,
    Node,
} from "../Graph";
import {RenderCamera} from "../Render";
import {EventEmitter} from "../Utils";
import {
    Container,
    IViewerMouseEvent,
    Navigator,
    Viewer,
} from "../Viewer";

export class EventLauncher {
    private _started: boolean;

    private _bearingSubscription: Subscription;
    private _currentNodeSubscription: Subscription;
    private _loadingSubscription: Subscription;
    private _moveSubscription: Subscription;
    private _sequenceEdgesSubscription: Subscription;
    private _spatialEdgesSubscription: Subscription;

    private _container: Container;
    private _eventEmitter: EventEmitter;
    private _navigator: Navigator;
    private _viewportCoords: ViewportCoords;
    private _geoCoords: GeoCoords;

    constructor(eventEmitter: EventEmitter, navigator: Navigator, container: Container) {
        this._container = container;
        this._eventEmitter = eventEmitter;
        this._navigator = navigator;
        this._viewportCoords = new ViewportCoords();
        this._geoCoords = new GeoCoords();

        this._started = false;
    }

    public get started(): boolean {
        return this._started;
    }

    public start(): void {
        if (this._started) {
            return;
        }

        this._started = true;

        this._loadingSubscription = this._navigator.loadingService.loading$
            .subscribe((loading: boolean): void => {
                this._eventEmitter.fire(Viewer.loadingchanged, loading);
            });

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
            .throttleTime(100)
            .distinctUntilChanged(
                (b1: number, b2: number): boolean => {
                    return Math.abs(b2 - b1) < 1;
                })
            .subscribe(
                (bearing): void => {
                    this._eventEmitter.fire(Viewer.bearingchanged, bearing);
                 });

        this._container.mouseService.staticClick$
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.reference$,
                this._navigator.stateService.currentTransform$)
            .map(
                ([event, render, reference, transform]: [MouseEvent, RenderCamera, ILatLonAlt, Transform]): IViewerMouseEvent => {
                    let [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, this._container.element);
                    let [viewportX, viewportY]: number[] =
                        this._viewportCoords.canvasToViewport(
                            canvasX,
                            canvasY,
                            this._container.element.offsetWidth,
                            this._container.element.offsetHeight);

                    let point3d: THREE.Vector3 = new THREE.Vector3(viewportX, viewportY, 1)
                        .unproject(render.perspective);

                    let basicPoint: number[] = transform.projectBasic(point3d.toArray());
                    if (basicPoint[0] < 0 || basicPoint[0] > 1 || basicPoint[1] < 0 || basicPoint[1] > 1) {
                        basicPoint = null;
                    }

                    let direction3d: THREE.Vector3 = point3d.clone().sub(render.camera.position).normalize();
                    let dist: number = -2 / direction3d.z;

                    let latLon: ILatLon = null;
                    if (dist > 0 && dist < 100) {
                        let point: THREE.Vector3 = direction3d.clone().multiplyScalar(dist).add(render.camera.position);
                        let latLonArray: number[] = this._geoCoords
                            .enuToGeodetic(
                                point.x,
                                point.y,
                                point.z,
                                reference.lat,
                                reference.lon,
                                reference.alt)
                            .slice(0, 2);

                        latLon = { lat: latLonArray[0], lon: latLonArray[1] };
                    }

                    return {
                        basicPoint: basicPoint,
                        latLon: latLon,
                        originalEvent: event,
                        pixelPoint: [canvasX, canvasY],
                        target: <Viewer>this._eventEmitter,
                        type: "click",
                    };
                })
            .subscribe(
                (event: IViewerMouseEvent): void => {
                    this._eventEmitter.fire("click", event);
                });
    }

    public stop(): void {
        if (!this.started) {
            return;
        }

        this._started = false;

        this._bearingSubscription.unsubscribe();
        this._loadingSubscription.unsubscribe();
        this._currentNodeSubscription.unsubscribe();
        this._moveSubscription.unsubscribe();
        this._sequenceEdgesSubscription.unsubscribe();
        this._spatialEdgesSubscription.unsubscribe();

        this._bearingSubscription = null;
        this._loadingSubscription = null;
        this._currentNodeSubscription = null;
        this._moveSubscription = null;
        this._sequenceEdgesSubscription = null;
        this._spatialEdgesSubscription = null;
    }
}

export default EventLauncher;
