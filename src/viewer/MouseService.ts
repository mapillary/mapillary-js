/// <reference path="../../typings/index.d.ts" />

import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/fromEvent";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/withLatestFrom";

import {IMouseClaim} from "../Viewer";

interface IMouseMoveOperation {
    (e: MouseEvent): MouseEvent;
}

interface IPreventMouseDownOperation {
    (prevent: boolean): boolean;
}

export class MouseService {
    private _element: HTMLElement;

    private _activeSubject$: BehaviorSubject<boolean>;
    private _active$: Observable<boolean>;

    private _preventMouseDownOperation$: Subject<IPreventMouseDownOperation>;
    private _preventMouseDown$: Subject<boolean>;

    private _mouseDown$: Observable<MouseEvent>;
    private _mouseMoveOperation$: Subject<IMouseMoveOperation>;
    private _mouseMove$: Observable<MouseEvent>;
    private _mouseLeave$: Observable<MouseEvent>;
    private _mouseUp$: Observable<MouseEvent>;
    private _mouseOver$: Observable<MouseEvent>;

    private _click$: Observable<MouseEvent>;

    private _mouseWheel$: Observable<WheelEvent>;

    private _mouseDragStart$: Observable<MouseEvent>;
    private _mouseDrag$: Observable<MouseEvent>;
    private _mouseDragEnd$: Observable<MouseEvent>;

    private _staticClick$: Observable<MouseEvent>;

    private _claimMouse$: Subject<IMouseClaim>;
    private _mouseOwner$: Observable<string>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._activeSubject$ = new BehaviorSubject<boolean>(false);

        this._active$ = this._activeSubject$
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();

        this._preventMouseDownOperation$ = new Subject<IPreventMouseDownOperation>();
        this._preventMouseDown$ = new Subject<boolean>();
        this._mouseMoveOperation$ = new Subject<IMouseMoveOperation>();
        this._claimMouse$ = new Subject<IMouseClaim>();

        this._mouseDown$ = Observable.fromEvent<MouseEvent>(element, "mousedown");
        this._mouseLeave$ = Observable.fromEvent<MouseEvent>(element, "mouseleave");
        this._mouseUp$ = Observable.fromEvent<MouseEvent>(element, "mouseup");
        this._mouseOver$ = Observable.fromEvent<MouseEvent>(element, "mouseover");

        this._click$ = Observable.fromEvent<MouseEvent>(element, "click");

        this._mouseWheel$ = Observable.fromEvent<WheelEvent>(element, "wheel");

        this._mouseWheel$
            .subscribe(
                (event: WheelEvent): void => {
                    event.preventDefault();
                });

        this._preventMouseDownOperation$
            .scan<boolean>(
                (prevent: boolean, operation: IPreventMouseDownOperation): boolean => {
                    return operation(prevent);
                },
                true)
            .subscribe();

        this._preventMouseDown$
            .map<IPreventMouseDownOperation>(
                (prevent: boolean): IPreventMouseDownOperation => {
                    return (previous: boolean): boolean => {
                        return prevent;
                    };
                })
            .subscribe(this._preventMouseDownOperation$);

        this._mouseDown$
            .map<IPreventMouseDownOperation>(
                (e: MouseEvent): IPreventMouseDownOperation => {
                    return (prevent: boolean): boolean => {
                        if (prevent) {
                            e.preventDefault();
                        }

                        return prevent;
                    };
                })
            .subscribe(this._preventMouseDownOperation$);

        this._mouseMove$ = this._mouseMoveOperation$
            .scan<MouseEvent>(
                (e: MouseEvent, operation: IMouseMoveOperation): MouseEvent => {
                    return operation(e);
                },
                null);

        Observable
            .fromEvent<MouseEvent>(element, "mousemove")
            .map<IMouseMoveOperation>(
                (e: MouseEvent) => {
                    return (previous: MouseEvent): MouseEvent => {
                        if (previous == null) {
                            previous = e;
                        }

                        if (e.movementX == null) {
                            Object.defineProperty(
                                e,
                                "movementX",
                                {
                                    configurable: false,
                                    enumerable: false,
                                    value: e.clientX - previous.clientX,
                                    writable: false,
                                });
                        }

                        if (e.movementY == null) {
                            Object.defineProperty(
                                e,
                                "movementY",
                                {
                                    configurable: false,
                                    enumerable: false,
                                    value: e.clientY - previous.clientY,
                                    writable: false,
                                });
                        }

                        return e;
                    };
                })
            .subscribe(this._mouseMoveOperation$);

        let dragStop$: Observable<MouseEvent> = Observable
            .merge<MouseEvent>(this._mouseLeave$, this._mouseUp$);

        this._mouseDragStart$ = this._mouseDown$
            .mergeMap<MouseEvent>((e: MouseEvent): Observable<MouseEvent> => {
                return this._mouseMove$
                    .takeUntil(dragStop$)
                    .take(1);
            });

        this._mouseDrag$ = this._mouseDown$
            .mergeMap<MouseEvent>((e: MouseEvent): Observable<MouseEvent> => {
                return this._mouseMove$
                    .skip(1)
                    .takeUntil(dragStop$);
            });

        this._mouseDragEnd$ = this._mouseDragStart$
            .mergeMap<MouseEvent>((e: MouseEvent): Observable<MouseEvent> => {
                return dragStop$.first();
            });

        this._staticClick$ = this._mouseDown$
            .switchMap<MouseEvent>(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._click$
                        .takeUntil(this._mouseMove$)
                        .take(1);
                });

        this._mouseOwner$ = this._claimMouse$
            .scan<{[key: string]: number}>(
                (claims: {[key: string]: number}, mouseClaim: IMouseClaim): {[key: string]: number} => {
                    if (mouseClaim.zindex == null) {
                        delete claims[mouseClaim.name];
                    } else {
                        claims[mouseClaim.name] = mouseClaim.zindex;
                    }
                    return claims;
                },
                {})
            .map<string>((claims: {[key: string]: number}): string => {
                let owner: string = null;
                let curZ: number = -1;

                for (let name in claims) {
                    if (claims.hasOwnProperty(name)) {
                        if (claims[name] > curZ) {
                            curZ = claims[name];
                            owner = name;
                        }
                    }
                }
                return owner;
            })
            .publishReplay(1)
            .refCount();
    }

    public get active$(): Observable<boolean> {
        return this._active$;
    }

    public get activate$(): Subject<boolean> {
        return this._activeSubject$;
    }

    public get mouseOwner$(): Observable<string> {
        return this._mouseOwner$;
    }

    public get mouseDown$(): Observable<MouseEvent> {
        return this._mouseDown$;
    }

    public get mouseMove$(): Observable<MouseEvent> {
        return this._mouseMove$;
    }

    public get mouseLeave$(): Observable<MouseEvent> {
        return this._mouseLeave$;
    }

    public get mouseUp$(): Observable<MouseEvent> {
        return this._mouseUp$;
    }

    public get click$(): Observable<MouseEvent> {
        return this._click$;
    }

    public get mouseWheel$(): Observable<WheelEvent> {
        return this._mouseWheel$;
    }

    public get mouseDragStart$(): Observable<MouseEvent> {
        return this._mouseDragStart$;
    }

    public get mouseDrag$(): Observable<MouseEvent> {
        return this._mouseDrag$;
    }

    public get mouseDragEnd$(): Observable<MouseEvent> {
        return this._mouseDragEnd$;
    }

    public get staticClick$(): Observable<MouseEvent> {
        return this._staticClick$;
    }

    public get preventDefaultMouseDown$(): Subject<boolean> {
        return this._preventMouseDown$;
    }

    public claimMouse(name: string, zindex: number): void {
        this._claimMouse$.next({name: name, zindex: zindex});
    }

    public unclaimMouse(name: string): void {
        this._claimMouse$.next({name: name, zindex: null});
    }

    public filtered$<T>(name: string, observable$: Observable<T>): Observable<T> {
        return observable$
            .withLatestFrom(
                this.mouseOwner$,
                (event: T, owner: string): [T, string] => {
                    return [event, owner];
                })
            .filter(
                (eo: [T, string]): boolean => {
                    return eo[1] === name;
                })
            .map<T>(
                (eo: [T, string]): T => {
                    return eo[0];
                });
    }
}

export default MouseService;
