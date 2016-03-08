/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

export class TouchService {
    private _element: HTMLElement;

    private _touchStart$: rx.Observable<TouchEvent>;
    private _touchMove$: rx.Observable<TouchEvent>;
    private _touchEnd$: rx.Observable<TouchEvent>;
    private _touchCancel$: rx.Observable<TouchEvent>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._touchStart$ = rx.Observable.fromEvent<TouchEvent>(element, "touchstart");
        this._touchMove$ = rx.Observable.fromEvent<TouchEvent>(element, "touchmove");
        this._touchEnd$ = rx.Observable.fromEvent<TouchEvent>(element, "touchend");
        this._touchCancel$ = rx.Observable.fromEvent<TouchEvent>(element, "touchcancel");
    }

    public get touchStart$(): rx.Observable<TouchEvent> {
        return this._touchStart$;
    }

    public get touchMove$(): rx.Observable<TouchEvent> {
        return this._touchMove$;
    }

    public get touchEnd$(): rx.Observable<TouchEvent> {
        return this._touchEnd$;
    }

    public get touchCancel$(): rx.Observable<TouchEvent> {
        return this._touchCancel$;
    }
}
