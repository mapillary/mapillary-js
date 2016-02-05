/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {EventEmitter} from "../Utils";
import {Navigator} from "../Viewer";

export class EventLauncher {
    private _stateSubscription: rx.IDisposable;
    private _loadingSubscription: rx.IDisposable;

    private _eventEmitter: EventEmitter;
    private _navigator: Navigator;

    constructor(eventEmitter: EventEmitter, navigator: Navigator) {
        this._eventEmitter = eventEmitter;
        this._navigator = navigator;

        this._loadingSubscription = this._navigator.loadingService.loading$
            .subscribe((loading: boolean): void => {
                this._eventEmitter.fire("loadingchanged", loading);
            });

        this._stateSubscription = this._navigator.stateService.currentNode$
            .subscribe((node: Node): void => {
                this._eventEmitter.fire("nodechanged", node);
            });
    }

    public dispose(): void {
        this._loadingSubscription.dispose();
        this._stateSubscription.dispose();
    }
}

export default EventLauncher;
