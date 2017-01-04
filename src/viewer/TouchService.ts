/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/switchMap";

export class TouchMove implements Touch {
    public movementX: number;
    public movementY: number;

    public identifier: number;

    public clientX: number;
    public clientY: number;
    public pageX: number;
    public pageY: number;
    public screenX: number;
    public screenY: number;

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
        this.pageX = touch.pageX;
        this.pageY = touch.pageY;
        this.screenX = touch.screenX;
        this.screenY = touch.screenY;

        this.target = touch.target;
    }
}

export interface IPinch {
    centerClientX: number;
    centerClientY: number;
    centerPageX: number;
    centerPageY: number;
    centerScreenX: number;
    centerScreenY: number;
    changeX: number;
    changeY: number;
    distance: number;
    distanceChange: number;
    distanceX: number;
    distanceY: number;
    touch1: Touch;
    touch2: Touch;
}

interface IPinchOperation {
    (pinch: IPinch): IPinch;
}

interface ITouchMoveOperation {
    (touchMove: TouchMove): TouchMove;
}

interface IPreventTouchMoveOperation {
    (prevent: boolean): boolean;
}

export class TouchService {
    private _element: HTMLElement;

    private _touchStart$: Observable<TouchEvent>;
    private _touchMove$: Observable<TouchEvent>;
    private _touchEnd$: Observable<TouchEvent>;
    private _touchCancel$: Observable<TouchEvent>;

    private _singleTouchMoveOperation$: Subject<ITouchMoveOperation>;
    private _singleTouchMove$: Observable<TouchMove>;
    private _singleTouch$: Observable<TouchMove>;

    private _pinchOperation$: Subject<IPinchOperation>;
    private _pinch$: Observable<IPinch>;
    private _pinchChange$: Observable<IPinch>;

    private _preventTouchMoveOperation$: Subject<IPreventTouchMoveOperation>;
    private _preventTouchMove$: Subject<boolean>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._touchStart$ = Observable.fromEvent<TouchEvent>(element, "touchstart");
        this._touchMove$ = Observable.fromEvent<TouchEvent>(element, "touchmove");
        this._touchEnd$ = Observable.fromEvent<TouchEvent>(element, "touchend");
        this._touchCancel$ = Observable.fromEvent<TouchEvent>(element, "touchcancel");

        this._preventTouchMoveOperation$ = new Subject<IPreventTouchMoveOperation>();
        this._preventTouchMove$ = new Subject<boolean>();

        this._preventTouchMoveOperation$
            .scan(
                (prevent: boolean, operation: IPreventTouchMoveOperation): boolean => {
                    return operation(prevent);
                },
                true)
            .subscribe(() => { /*noop*/ });

        this._preventTouchMove$
            .map(
                (prevent: boolean): IPreventTouchMoveOperation => {
                    return (previous: boolean): boolean => {
                        return prevent;
                    };
                })
            .subscribe(this._preventTouchMoveOperation$);

        this._touchMove$
            .map(
                (te: TouchEvent): IPreventTouchMoveOperation => {
                    return (prevent: boolean): boolean => {
                        if (prevent) {
                            te.preventDefault();
                        }

                        return prevent;
                    };
                })
            .subscribe(this._preventTouchMoveOperation$);

        this._singleTouchMoveOperation$ = new Subject<ITouchMoveOperation>();

        this._singleTouchMove$ = this._singleTouchMoveOperation$
            .scan(
                (touch: TouchMove, operation: ITouchMoveOperation): TouchMove => {
                    return operation(touch);
                },
                new TouchMove());

        this._touchMove$
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                })
            .map(
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

        let singleTouchStart$: Observable<TouchEvent> = Observable
            .merge<TouchEvent>(
                this._touchStart$,
                this._touchEnd$,
                this._touchCancel$)
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                });

        let multipleTouchStart$: Observable<TouchEvent> = Observable
            .merge<TouchEvent>(
                this._touchStart$,
                this._touchEnd$,
                this._touchCancel$)
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length >= 1;
                });

        let touchStop$: Observable<TouchEvent> = Observable
            .merge<TouchEvent>(
                this._touchEnd$,
                this._touchCancel$)
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 0;
                });

        this._singleTouch$ = singleTouchStart$
            .switchMap(
                (te: TouchEvent): Observable<TouchMove> => {
                    return this._singleTouchMove$
                        .skip(1)
                        .takeUntil(
                            Observable
                                .merge(
                                    multipleTouchStart$,
                                    touchStop$));
                });

        let touchesChanged$: Observable<TouchEvent> = Observable
            .merge<TouchEvent>(
                this._touchStart$,
                this._touchEnd$,
                this._touchCancel$);

        let pinchStart$: Observable<TouchEvent> = touchesChanged$
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 2 && te.targetTouches.length === 2;
                });

        let pinchStop$: Observable<TouchEvent> = touchesChanged$
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length !== 2 || te.targetTouches.length !== 2;
                });
        this._pinchOperation$ = new Subject<IPinchOperation>();

        this._pinch$ = this._pinchOperation$
            .scan(
                (pinch: IPinch, operation: IPinchOperation): IPinch => {
                    return operation(pinch);
                },
                {
                    centerClientX: 0,
                    centerClientY: 0,
                    centerPageX: 0,
                    centerPageY: 0,
                    centerScreenX: 0,
                    centerScreenY: 0,
                    changeX: 0,
                    changeY: 0,
                    distance: 0,
                    distanceChange: 0,
                    distanceX: 0,
                    distanceY: 0,
                    touch1: null,
                    touch2: null,
                });

        this._touchMove$
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 2 && te.targetTouches.length === 2;
                })
            .map(
                (te: TouchEvent): IPinchOperation => {
                    return (previous: IPinch): IPinch => {
                        let touch1: Touch = te.touches[0];
                        let touch2: Touch = te.touches[1];

                        let minX: number = Math.min(touch1.clientX, touch2.clientX);
                        let maxX: number = Math.max(touch1.clientX, touch2.clientX);

                        let minY: number = Math.min(touch1.clientY, touch2.clientY);
                        let maxY: number = Math.max(touch1.clientY, touch2.clientY);

                        let centerClientX: number = minX + (maxX - minX) / 2;
                        let centerClientY: number = minY + (maxY - minY) / 2;

                        let centerPageX: number = centerClientX + touch1.pageX - touch1.clientX;
                        let centerPageY: number = centerClientY + touch1.pageY - touch1.clientY;

                        let centerScreenX: number = centerClientX + touch1.screenX - touch1.clientX;
                        let centerScreenY: number = centerClientY + touch1.screenY - touch1.clientY;

                        let distanceX: number = Math.abs(touch1.clientX - touch2.clientX);
                        let distanceY: number = Math.abs(touch1.clientY - touch2.clientY);

                        let distance: number = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                        let distanceChange: number = distance - previous.distance;

                        let changeX: number = distanceX - previous.distanceX;
                        let changeY: number = distanceY - previous.distanceY;

                        let current: IPinch = {
                            centerClientX: centerClientX,
                            centerClientY: centerClientY,
                            centerPageX: centerPageX,
                            centerPageY: centerPageY,
                            centerScreenX: centerScreenX,
                            centerScreenY: centerScreenY,
                            changeX: changeX,
                            changeY: changeY,
                            distance: distance,
                            distanceChange: distanceChange,
                            distanceX: distanceX,
                            distanceY: distanceY,
                            touch1: touch1,
                            touch2: touch2,
                        };

                        return current;
                    };
                })
            .subscribe(this._pinchOperation$);

        this._pinchChange$ = pinchStart$
            .switchMap(
                (te: TouchEvent): Observable<IPinch> => {
                    return this._pinch$
                        .skip(1)
                        .takeUntil(pinchStop$);
                });
    }

    public get touchStart$(): Observable<TouchEvent> {
        return this._touchStart$;
    }

    public get touchMove$(): Observable<TouchEvent> {
        return this._touchMove$;
    }

    public get touchEnd$(): Observable<TouchEvent> {
        return this._touchEnd$;
    }

    public get touchCancel$(): Observable<TouchEvent> {
        return this._touchCancel$;
    }

    public get singleTouchMove$(): Observable<TouchMove> {
        return this._singleTouch$;
    }

    public get pinch$(): Observable<IPinch> {
        return this._pinchChange$;
    }

    public get preventDefaultTouchMove$(): Subject<boolean> {
        return this._preventTouchMove$;
    }
}
