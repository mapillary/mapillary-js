/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../../Edge";

export class SequenceDOMInteraction {
    private _mouseEnterDirection$: rx.Subject<EdgeDirection>;
    private _mouseLeaveDirection$: rx.Subject<EdgeDirection>;

    constructor() {
        this._mouseEnterDirection$ = new rx.Subject<EdgeDirection>();
        this._mouseLeaveDirection$ = new rx.Subject<EdgeDirection>();
    }

    public get mouseEnterDirection$(): rx.Subject<EdgeDirection> {
        return this._mouseEnterDirection$;
    }

    public get mouseLeaveDirection$(): rx.Subject<EdgeDirection> {
        return this._mouseLeaveDirection$;
    }
}

export default SequenceDOMInteraction;
