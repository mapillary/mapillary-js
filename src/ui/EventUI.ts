/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IUI} from "../UI";
import {EventEmitter} from "../Utils";

export class EventUI implements IUI {
    private disposableState: rx.IDisposable;
    private disposableLoading: rx.IDisposable;
    private eventEmitter: EventEmitter;
    private navigator: Navigator;

    constructor(eventEmitter: EventEmitter, container: Container, navigator: Navigator) {
        this.eventEmitter = eventEmitter;
        this.navigator = navigator;
    }

    public activate(): void {
        this.disposableLoading = this.navigator.loadingService.loading$.subscribe((loading: boolean): void => {
            this.eventEmitter.fire("loadingchanged", loading);
        });

        this.disposableState = this.navigator.stateService.currentNode$.subscribe((node: Node): void => {
            this.eventEmitter.fire("nodechanged", node);
        });
    }

    public deactivate(): void {
        this.disposableLoading.dispose();
        this.disposableState.dispose();
    }
}

export default EventUI;
