/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {EventEmitter} from "../Utils";
import {StateService} from "../State";
import {LoadingService} from "../Viewer";

export class EventLauncher {
    private _stateSubscription: rx.IDisposable;
    private _loadingSubscription: rx.IDisposable;

    private _eventEmitter: EventEmitter;
    private _loadingService: LoadingService;
    private _stateService: StateService;

    constructor(eventEmitter: EventEmitter, loadingService: LoadingService, stateService: StateService) {
        this._eventEmitter = eventEmitter;
        this._loadingService = loadingService;
        this._stateService = stateService;

        this._loadingSubscription = this._loadingService.loading$.subscribe((loading: boolean): void => {
            this._eventEmitter.fire("loadingchanged", loading);
        });

        this._stateSubscription = this._stateService.currentNode$.subscribe((node: Node): void => {
            this._eventEmitter.fire("nodechanged", node);
        });
    }

    public dispose(): void {
        this._loadingSubscription.dispose();
        this._stateSubscription.dispose();
    }
}

export default EventLauncher;
