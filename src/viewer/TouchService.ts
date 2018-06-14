import {
    merge as observableMerge,
    fromEvent as observableFromEvent,
    timer as observableTimer,
    BehaviorSubject,
    Observable,
    Subject,
} from "rxjs";

import {
    bufferWhen,
    mergeMap,
    take,
    takeUntil,
    switchMap,
    distinctUntilChanged,
    scan,
    refCount,
    first,
    map,
    skip,
    share,
    filter,
    publishReplay,
} from "rxjs/operators";

import {IPinch} from "../Viewer";

interface IPinchOperation {
    (pinch: IPinch): IPinch;
}

export class TouchService {
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

    constructor(canvasContainer: HTMLElement, domContainer: HTMLElement) {
        this._activeSubject$ = new BehaviorSubject<boolean>(false);

        this._active$ = this._activeSubject$.pipe(
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        observableFromEvent<TouchEvent>(domContainer, "touchmove")
            .subscribe(
                (event: TouchEvent): void => {
                    event.preventDefault();
                });

        this._touchStart$ = observableFromEvent<TouchEvent>(canvasContainer, "touchstart");
        this._touchMove$ = observableFromEvent<TouchEvent>(canvasContainer, "touchmove");
        this._touchEnd$ = observableFromEvent<TouchEvent>(canvasContainer, "touchend");
        this._touchCancel$ = observableFromEvent<TouchEvent>(canvasContainer, "touchcancel");

        const tapStart$: Observable<TouchEvent> = this._touchStart$.pipe(
            filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                }),
            share());

        this._doubleTap$ = tapStart$.pipe(
            bufferWhen(
                (): Observable<number | TouchEvent> => {
                    return tapStart$.pipe(
                        first(),
                        switchMap(
                            (event: TouchEvent): Observable<number | TouchEvent> => {
                                return observableMerge(
                                        observableTimer(300),
                                        tapStart$).pipe(
                                    take(1));
                            }));
                }),
            filter(
                (events: TouchEvent[]): boolean => {
                    return events.length === 2;
                }),
            map(
                (events: TouchEvent[]): TouchEvent => {
                    return events[events.length - 1];
                }),
            share());

        this._doubleTap$
            .subscribe(
                (event: TouchEvent): void => {
                    event.preventDefault();
                });

        this._singleTouchMove$ = this._touchMove$.pipe(
            filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                }),
            share());

        let singleTouchStart$: Observable<TouchEvent> = observableMerge<TouchEvent>(
                this._touchStart$,
                this._touchEnd$,
                this._touchCancel$).pipe(
            filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 1 && te.targetTouches.length === 1;
                }));

        let multipleTouchStart$: Observable<TouchEvent> = observableMerge<TouchEvent>(
                this._touchStart$,
                this._touchEnd$,
                this._touchCancel$).pipe(
            filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length >= 1;
                }));

        let touchStop$: Observable<TouchEvent> = observableMerge<TouchEvent>(
                this._touchEnd$,
                this._touchCancel$).pipe(
            filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 0;
                }));

        this._singleTouchDragStart$ = singleTouchStart$.pipe(
            mergeMap(
                (e: TouchEvent): Observable<TouchEvent> => {
                    return this._singleTouchMove$.pipe(
                        takeUntil(
                            observableMerge(
                                touchStop$,
                                multipleTouchStart$)),
                        take(1));
                }));

        this._singleTouchDragEnd$ = singleTouchStart$.pipe(
            mergeMap(
                (e: TouchEvent): Observable<TouchEvent> => {
                    return observableMerge(
                            touchStop$,
                            multipleTouchStart$).pipe(
                        first());
                }));

        this._singleTouchDrag$ = singleTouchStart$.pipe(
            switchMap(
                (te: TouchEvent): Observable<TouchEvent> => {
                    return this._singleTouchMove$.pipe(
                        skip(1),
                        takeUntil(
                            observableMerge(
                                    multipleTouchStart$,
                                    touchStop$)));
                }));

        let touchesChanged$: Observable<TouchEvent> = observableMerge<TouchEvent>(
                this._touchStart$,
                this._touchEnd$,
                this._touchCancel$);

        this._pinchStart$ = touchesChanged$.pipe(
            filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 2 && te.targetTouches.length === 2;
                }));

        this._pinchEnd$ = touchesChanged$.pipe(
            filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length !== 2 || te.targetTouches.length !== 2;
                }));

        this._pinchOperation$ = new Subject<IPinchOperation>();

        this._pinch$ = this._pinchOperation$.pipe(
            scan(
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
                }));

        this._touchMove$.pipe(
            filter(
                (te: TouchEvent): boolean => {
                    return te.touches.length === 2 && te.targetTouches.length === 2;
                }),
            map(
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
                }))
            .subscribe(this._pinchOperation$);

        this._pinchChange$ = this._pinchStart$.pipe(
            switchMap(
                (te: TouchEvent): Observable<IPinch> => {
                    return this._pinch$.pipe(
                        skip(1),
                        takeUntil(this._pinchEnd$));
                }));
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
