/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

export class MouseService {
    private _element: HTMLElement;

    private _mouseDown$: rx.Observable<MouseEvent>;
    private _mouseMove$: rx.Observable<MouseEvent>;
    private _mouseLeave$: rx.Observable<MouseEvent>;
    private _mouseUp$: rx.Observable<MouseEvent>;

    private _mouseDragStart$: rx.Observable<MouseEvent>;
    private _mouseDrag$: rx.Observable<MouseEvent>;
    private _mouseDragEnd$: rx.Observable<MouseEvent>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._mouseDown$ = rx.Observable.fromEvent<MouseEvent>(element, "mousedown");
        this._mouseMove$ = rx.Observable.fromEvent<MouseEvent>(element, "mousemove");
        this._mouseLeave$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseleave");
        this._mouseUp$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseup");

        let dragStop$: rx.Observable<MouseEvent> = rx.Observable
            .merge<MouseEvent>([this._mouseLeave$, this._mouseUp$]);

        this._mouseDragStart$ = this._mouseDown$
            .selectMany<MouseEvent>((e: MouseEvent): rx.Observable<MouseEvent> => {
                return this._mouseMove$
                    .takeUntil(dragStop$)
                    .take(1);
            });

        this._mouseDrag$ = this._mouseDown$
            .selectMany<MouseEvent>((e: MouseEvent): rx.Observable<MouseEvent> => {
                return this._mouseMove$
                    .skip(1)
                    .takeUntil(dragStop$);
            });

        this._mouseDragEnd$ = this._mouseDragStart$
            .selectMany<MouseEvent>((e: MouseEvent): rx.Observable<MouseEvent> => {
                return dragStop$.first();
            });
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

    public get mouseDragStart$(): rx.Observable<MouseEvent> {
        return this._mouseDragStart$;
    }

    public get mouseDrag$(): rx.Observable<MouseEvent> {
        return this._mouseDrag$;
    }

    public get mouseDragEnd$(): rx.Observable<MouseEvent> {
        return this._mouseDragEnd$;
    }
}

export default MouseService;
