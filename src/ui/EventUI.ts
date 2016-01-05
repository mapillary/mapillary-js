/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {Node} from "../Graph";
import {Navigator} from "../Viewer";
import {IUI} from "../UI";

export class EventUI implements IUI {
    private disposable: rx.IDisposable;
    private navigator: Navigator;
    private cbs: any[];

    constructor(navigator: Navigator) {
        this.navigator = navigator;
        this.cbs = [];
    }

    public activate(): void {
        this.disposable = this.navigator.stateService.currentNode.subscribe((node: Node): void => {
            _.map(this.cbs, (cb: any) => {
                cb(node);
            });
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }

    public on(event: string, cb: any): void {
        this.cbs.push(cb);
    }
}

export default EventUI;
