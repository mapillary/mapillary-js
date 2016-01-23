/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

export class MouseService {
    private _element: HTMLElement;

    private _mouseDown$: rx.Observable<MouseEvent>;
    private _mouseMove$: rx.Observable<MouseEvent>;
    private _mouseLeave$: rx.Observable<MouseEvent>;
    private _mouseUp$: rx.Observable<MouseEvent>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._mouseDown$ = rx.Observable.fromEvent<MouseEvent>(element, "mousedown");
        this._mouseMove$ = rx.Observable.fromEvent<MouseEvent>(element, "mousemove");
        this._mouseLeave$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseleave");
        this._mouseUp$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseup");
    }

    public get mouseDown$(): rx.Observable<MouseEvent> {
        return this._mouseDown$;
    }

    public get mouseMove$(): rx.Observable<MouseEvent> {
        return this._mouseMove$;
    }

    public get mouseLeave$(): rx.Observable<MouseEvent> {
        return this._mouseLeave$;
    }

    public get mouseUp$(): rx.Observable<MouseEvent> {
        return this._mouseUp$;
    }
}

export default MouseService;
