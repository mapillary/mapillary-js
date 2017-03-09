import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/timer";

import "rxjs/add/operator/bufferWhen";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/switchMap";

import {IPinch} from "../Viewer";

interface IPinchOperation {
    (pinch: IPinch): IPinch;
}

export class TouchService {
    private _element: HTMLElement;

    private _activeSubject$: BehaviorSubject<boolean>;
    private _active$: Observable<boolean>;

    private _touchStart$: Observable<TouchEvent>;
    private _touchMove$: Observable<TouchEvent>;
    private _touchEnd$: Observable<TouchEvent>;
    private _touchCancel$: Observable<TouchEvent>;

    private _singleTouchDrag$: Observable<TouchEvent>;
    private _singleTouchDragStart$: Observable<TouchEvent>;
    private _singleTouchDragEnd$: Observable<TouchEvent>;
    private _singleTouchMove$: Observable<TouchEvent>;

    private _pinchOperation$: Subject<IPinchOperation>;
    private _pinch$: Observable<IPinch>;
    private _pinchStart$: Observable<TouchEvent>;
    private _pinchEnd$: Observable<TouchEvent>;
    private _pinchChange$: Observable<IPinch>;

    private _doubleTap$: Observable<TouchEvent>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._activeSubject$ = new BehaviorSubject<boolean>(false);

        this._active$ = this._activeSubject$
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();

        this._touchStart$ = Observable.fromEvent<TouchEvent>(element, "touchstart");
        this._touchMove$ = Observable.fromEvent<TouchEvent>(element, "touchmove");
        this._touchEnd$ = Observable.fromEvent<TouchEvent>(element, "touchend");
        this._touchCancel$ = Observable.fromEvent<TouchEvent>(element, "touchcancel");

        const tapStart$: Observable<TouchEvent> = this._touchStart$
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                })
            .share();

        this._doubleTap$ = tapStart$
            .bufferWhen(
                (): Observable<number> => {
                    return tapStart$
                        .first()
                        .switchMap(
                            (event: TouchEvent): Observable<number | TouchEvent> => {
                                return Observable
                                    .timer(300)
                                    .merge(tapStart$)
                                    .take(1);
                            });
                })
            .filter(
                (events: TouchEvent[]): boolean => {
                    return events.length === 2;
                })
            .map(
                (events: TouchEvent[]): TouchEvent => {
                    return events[events.length - 1];
                })
            .share();

        this._singleTouchMove$ = this._touchMove$
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                })
            .share();

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

        this._singleTouchDragStart$ = singleTouchStart$
            .mergeMap(
                (e: TouchEvent): Observable<TouchEvent> => {
                    return this._singleTouchMove$
                        .takeUntil(
                            Observable.merge(
                                touchStop$,
                                multipleTouchStart$))
                        .take(1);
                });

        this._singleTouchDragEnd$ = singleTouchStart$
            .mergeMap(
                (e: TouchEvent): Observable<TouchEvent> => {
                    return Observable
                        .merge(
                            touchStop$,
                            multipleTouchStart$)
                        .first();
                });

        this._singleTouchDrag$ = singleTouchStart$
            .switchMap(
                (te: TouchEvent): Observable<TouchEvent> => {
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

        this._pinchStart$ = touchesChanged$
            .filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 2 && te.targetTouches.length === 2;
                });

        this._pinchEnd$ = touchesChanged$
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
                    changeX: 0,
                    changeY: 0,
                    clientX: 0,
                    clientY: 0,
                    distance: 0,
                    distanceChange: 0,
                    distanceX: 0,
                    distanceY: 0,
                    originalEvent: null,
                    pageX: 0,
                    pageY: 0,
                    screenX: 0,
                    screenY: 0,
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
                            changeX: changeX,
                            changeY: changeY,
                            clientX: centerClientX,
                            clientY: centerClientY,
                            distance: distance,
                            distanceChange: distanceChange,
                            distanceX: distanceX,
                            distanceY: distanceY,
                            originalEvent: te,
                            pageX: centerPageX,
                            pageY: centerPageY,
                            screenX: centerScreenX,
                            screenY: centerScreenY,
                            touch1: touch1,
                            touch2: touch2,
                        };

                        return current;
                    };
                })
            .subscribe(this._pinchOperation$);

        this._pinchChange$ = this._pinchStart$
            .switchMap(
                (te: TouchEvent): Observable<IPinch> => {
                    return this._pinch$
                        .skip(1)
                        .takeUntil(this._pinchEnd$);
                });
    }

    public get active$(): Observable<boolean> {
        return this._active$;
    }

    public get activate$(): Subject<boolean> {
        return this._activeSubject$;
    }

    public get doubleTap$(): Observable<TouchEvent> {
        return this._doubleTap$;
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

    public get singleTouchDragStart$(): Observable<TouchEvent> {
        return this._singleTouchDragStart$;
    }

    public get singleTouchDrag$(): Observable<TouchEvent> {
        return this._singleTouchDrag$;
    }

    public get singleTouchDragEnd$(): Observable<TouchEvent> {
        return this._singleTouchDragEnd$;
    }

    public get pinch$(): Observable<IPinch> {
        return this._pinchChange$;
    }

    public get pinchStart$(): Observable<TouchEvent> {
        return this._pinchStart$;
    }

    public get pinchEnd$(): Observable<TouchEvent> {
        return this._pinchEnd$;
    }
}
