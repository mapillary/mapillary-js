/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {IMouseClaim} from "../Viewer";

interface IMouseMoveOperation {
    (e: MouseEvent): MouseEvent;
}

interface IPreventMouseDownOperation {
    (prevent: boolean): boolean;
}

export class MouseService {
    private _element: HTMLElement;

    private _preventMouseDownOperation$: rx.Subject<IPreventMouseDownOperation>;
    private _preventMouseDown$: rx.Subject<boolean>;

    private _mouseDown$: rx.Observable<MouseEvent>;
    private _mouseMoveOperation$: rx.Subject<IMouseMoveOperation>;
    private _mouseMove$: rx.Observable<MouseEvent>;
    private _mouseLeave$: rx.Observable<MouseEvent>;
    private _mouseUp$: rx.Observable<MouseEvent>;
    private _mouseOver$: rx.Observable<MouseEvent>;

    private _mouseWheel$: rx.Observable<WheelEvent>;

    private _mouseDragStart$: rx.Observable<MouseEvent>;
    private _mouseDrag$: rx.Observable<MouseEvent>;
    private _mouseDragEnd$: rx.Observable<MouseEvent>;

    private _claimMouse$: rx.Subject<IMouseClaim>;
    private _mouseOwner$: rx.Observable<string>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._preventMouseDownOperation$ = new rx.Subject<IPreventMouseDownOperation>();
        this._preventMouseDown$ = new rx.Subject<boolean>();
        this._mouseMoveOperation$ = new rx.Subject<IMouseMoveOperation>();
        this._claimMouse$ = new rx.Subject<IMouseClaim>();

        this._mouseDown$ = rx.Observable.fromEvent<MouseEvent>(element, "mousedown");
        this._mouseLeave$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseleave");
        this._mouseUp$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseup");
        this._mouseOver$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseover");

        this._mouseWheel$ = rx.Observable.fromEvent<WheelEvent>(element, "wheel");

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
                new MouseEvent("mousemove"));

        rx.Observable
            .fromEvent<MouseEvent>(element, "mousemove")
            .map<IMouseMoveOperation>(
                (e: MouseEvent) => {
                    return (previous: MouseEvent): MouseEvent => {
                        if (e.movementX == null) {
                            e.movementX = e.offsetX - previous.offsetX;
                        }

                        if (e.movementY == null) {
                            e.movementY = e.offsetY - previous.offsetY;
                        }

                        return e;
                    };
                })
            .subscribe(this._mouseMoveOperation$);

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
            .shareReplay(1);
    }

    public claimMouse(name: string, zindex: number): void {
        this._claimMouse$.onNext({name: name, zindex: zindex});
    }

    public unclaimMouse(name: string): void {
        this._claimMouse$.onNext({name: name, zindex: null});
    }

    public filtered$<T>(name: string, observable$: rx.Observable<T>): rx.Observable<T> {
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

    public get mouseOwner$(): rx.Observable<string> {
        return this._mouseOwner$;
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

    public get mouseWheel$(): rx.Observable<WheelEvent> {
        return this._mouseWheel$;
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

    public get preventDefaultMouseDown$(): rx.Subject<boolean> {
        return this._preventMouseDown$;
    }
}

export default MouseService;
