/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

export class TouchMove implements Touch {
    public movementX: number;
    public movementY: number;

    public identifier: number;

    public clientX: number;
    public clientY: number;
    public screenX: number;
    public screenY: number;
    public pageX: number;
    public pageY: number;

    public target: EventTarget;

    constructor(touch?: Touch) {
        this.movementX = 0;
        this.movementY = 0;

        if (touch == null) {
            return;
        }

        this.identifier = touch.identifier;

        this.clientX = touch.clientX;
        this.clientY = touch.clientY;
        this.screenX = touch.screenX;
        this.screenY = touch.screenY;
        this.pageX = touch.pageX;
        this.pageY = touch.pageY;

        this.target = touch.target;
    }
}

interface ITouchMoveOperation {
    (touchMove: TouchMove): TouchMove;
}

interface IPreventTouchMoveOperation {
    (prevent: boolean): boolean;
}

export class TouchService {
    private _element: HTMLElement;

    private _touchStart$: rx.Observable<TouchEvent>;
    private _touchMove$: rx.Observable<TouchEvent>;
    private _touchEnd$: rx.Observable<TouchEvent>;
    private _touchCancel$: rx.Observable<TouchEvent>;

    private _singleTouchMoveOperation$: rx.Subject<ITouchMoveOperation>;
    private _singleTouchMove$: rx.Observable<TouchMove>;
    private _singleTouch$: rx.Observable<TouchMove>;

    private _preventTouchMoveOperation$: rx.Subject<IPreventTouchMoveOperation>;
    private _preventTouchMove$: rx.Subject<boolean>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._touchStart$ = rx.Observable.fromEvent<TouchEvent>(element, "touchstart");
        this._touchMove$ = rx.Observable.fromEvent<TouchEvent>(element, "touchmove");
        this._touchEnd$ = rx.Observable.fromEvent<TouchEvent>(element, "touchend");
        this._touchCancel$ = rx.Observable.fromEvent<TouchEvent>(element, "touchcancel");

        this._preventTouchMoveOperation$ = new rx.Subject<IPreventTouchMoveOperation>();
        this._preventTouchMove$ = new rx.Subject<boolean>();

        this._preventTouchMoveOperation$
            .scan<boolean>(
                (prevent: boolean, operation: IPreventTouchMoveOperation): boolean => {
                    return operation(prevent);
                },
                true)
            .subscribe();

        this._preventTouchMove$
            .map<IPreventTouchMoveOperation>(
                (prevent: boolean): IPreventTouchMoveOperation => {
                    return (previous: boolean): boolean => {
                        return prevent;
                    };
                })
            .subscribe(this._preventTouchMoveOperation$);

        this._touchMove$
            .map<IPreventTouchMoveOperation>(
                (te: TouchEvent): IPreventTouchMoveOperation => {
                    return (prevent: boolean): boolean => {
                        if (prevent) {
                            te.preventDefault();
                        }

                        return prevent;
                    };
                })
            .subscribe(this._preventTouchMoveOperation$);

        this._singleTouchMoveOperation$ = new rx.Subject<ITouchMoveOperation>();

        this._singleTouchMove$ = this._singleTouchMoveOperation$
            .scan<TouchMove>(
                (touch: TouchMove, operation: ITouchMoveOperation): TouchMove => {
                    return operation(touch);
                },
                new TouchMove());

        this._touchMove$
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                })
            .map<ITouchMoveOperation>(
                (te: TouchEvent): ITouchMoveOperation => {
                    return (previous: TouchMove): TouchMove => {
                        let touch: Touch = te.touches[0];

                        let current: TouchMove = new TouchMove(touch);

                        current.movementX = touch.pageX - previous.pageX;
                        current.movementY = touch.pageY - previous.pageY;

                        return current;
                    };
                })
            .subscribe(this._singleTouchMoveOperation$);

        let singleTouchStart$: rx.Observable<TouchEvent> = rx.Observable
            .merge(
                this._touchStart$,
                this._touchEnd$,
                this._touchCancel$)
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                });

        let multipleTouchStart$: rx.Observable<TouchEvent> = rx.Observable
            .merge(
                this._touchStart$,
                this._touchEnd$,
                this._touchCancel$)
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length >= 1;
                });

        let touchStop$: rx.Observable<TouchEvent> = rx.Observable
            .merge(
                this._touchEnd$,
                this._touchCancel$)
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 0;
                });

        this._singleTouch$ = singleTouchStart$
            .flatMapLatest(
                (te: TouchEvent): rx.Observable<TouchMove> => {
                    return this._singleTouchMove$
                        .skip(1)
                        .takeUntil(
                            rx.Observable.merge(
                                multipleTouchStart$,
                                touchStop$));
                });
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

    public get singleTouchMove$(): rx.Observable<TouchMove> {
        return this._singleTouch$;
    }

    public get preventDefaultTouchMove$(): rx.Subject<boolean> {
        return this._preventTouchMove$;
    }
}
