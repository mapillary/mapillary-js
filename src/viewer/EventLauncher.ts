import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";

import {IEdgeStatus, Node} from "../Graph";
import {EventEmitter} from "../Utils";
import {Container, Navigator, Viewer} from "../Viewer";

export class EventLauncher {
    private _currentNodeSubscription: Subscription;
    private _loadingSubscription: Subscription;
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
            .switchMap<IEdgeStatus>(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.sequenceEdges$;
                })
            .subscribe(
                (status: IEdgeStatus): void => {
                    this._eventEmitter.fire(Viewer.sequenceedgeschanged, status);
                });

        this._spatialEdgesSubscription = this._navigator.stateService.currentNodeExternal$
            .switchMap<IEdgeStatus>(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.spatialEdges$;
                })
            .subscribe(
                (status: IEdgeStatus): void => {
                    this._eventEmitter.fire(Viewer.spatialedgeschanged, status);
                });

        Observable
            .combineLatest<boolean>(
                this._navigator.stateService.moving$,
                this._container.mouseService.active$)
            .map<boolean>(
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
    }

    public dispose(): void {
        this._loadingSubscription.unsubscribe();
        this._currentNodeSubscription.unsubscribe();
    }
}

export default EventLauncher;
