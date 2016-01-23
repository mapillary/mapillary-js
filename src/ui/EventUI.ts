/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {UI} from "../UI";
import {EventEmitter} from "../Utils";

export class EventUI extends UI {
    public static uiName: string = "event";
    private _disposableState: rx.IDisposable;
    private _disposableLoading: rx.IDisposable;
    private _eventEmitter: EventEmitter;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
        this._eventEmitter = null;
    }

    public configure(options: any): void {
        this._eventEmitter = options.eventEmitter;
    }

    protected _activate(): void {
        this._disposableLoading = this._navigator.loadingService.loading$.subscribe((loading: boolean): void => {
            this._eventEmitter.fire("loadingchanged", loading);
        });

        this._disposableState = this._navigator.stateService.currentNode$.subscribe((node: Node): void => {
            this._eventEmitter.fire("nodechanged", node);
        });
    }

    protected _deactivate(): void {
        this._disposableLoading.dispose();
        this._disposableState.dispose();
    }
}

export default EventUI;
