import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";

import {NewNode} from "../Graph";
import {EventEmitter} from "../Utils";
import {Container, Navigator} from "../Viewer";

export class EventLauncher {
    private _stateSubscription: Subscription;
    private _loadingSubscription: Subscription;

    private _container: Container;
    private _eventEmitter: EventEmitter;
    private _navigator: Navigator;

    constructor(eventEmitter: EventEmitter, navigator: Navigator, container: Container) {
        this._container = container;
        this._eventEmitter = eventEmitter;
        this._navigator = navigator;

        this._loadingSubscription = this._navigator.loadingService.loading$
            .subscribe((loading: boolean): void => {
                this._eventEmitter.fire("loadingchanged", loading);
            });

        this._stateSubscription = this._navigator.stateService.currentNodeExternal$
            .subscribe((node: NewNode): void => {
                this._eventEmitter.fire("nodechanged", node);
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
                (moving: boolean) => {
                    if (moving) {
                        this._eventEmitter.fire("movestart", null);
                    } else {
                        this._eventEmitter.fire("moveend", null);
                    }
                });
    }

    public dispose(): void {
        this._loadingSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
    }
}

export default EventLauncher;
