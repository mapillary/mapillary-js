import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/throttleTime";

import {
    IEdgeStatus,
    Node,
} from "../Graph";
import {EventEmitter} from "../Utils";
import {
    Container,
    Navigator,
    Viewer,
} from "../Viewer";

export class EventLauncher {
    private _bearingSubscription: Subscription;
    private _currentNodeSubscription: Subscription;
    private _loadingSubscription: Subscription;
    private _moveSubscription: Subscription;
    private _sequenceEdgesSubscription: Subscription;
    private _spatialEdgesSubscription: Subscription;

    private _container: Container;
    private _eventEmitter: EventEmitter;
    private _navigator: Navigator;

    constructor(eventEmitter: EventEmitter, navigator: Navigator, container: Container) {
        this._container = container;
        this._eventEmitter = eventEmitter;
        this._navigator = navigator;

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
                this._navigator.stateService.moving$,
                this._container.mouseService.active$)
            .map(
                (values: boolean[]): boolean => {
                    return values[0] || values[1];
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
    }

    public dispose(): void {
        this._bearingSubscription.unsubscribe();
        this._loadingSubscription.unsubscribe();
        this._currentNodeSubscription.unsubscribe();
        this._moveSubscription.unsubscribe();
        this._sequenceEdgesSubscription.unsubscribe();
        this._spatialEdgesSubscription.unsubscribe();
    }
}

export default EventLauncher;
