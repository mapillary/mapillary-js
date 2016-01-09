/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IUI} from "../UI";
import {EventEmitter} from "../Utils";

export class EventUI implements IUI {
    private disposable: rx.IDisposable;
    private eventEmitter: EventEmitter;
    private navigator: Navigator;

    constructor(eventEmitter: EventEmitter, container: Container, navigator: Navigator) {
        this.eventEmitter = eventEmitter;
        this.navigator = navigator;
    }

    public activate(): void {
        this.disposable = this.navigator.stateService2.currentNode.subscribe((node: Node): void => {
            this.eventEmitter.fire("moveend", node);
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }
}

export default EventUI;
