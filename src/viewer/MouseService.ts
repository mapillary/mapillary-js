/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import {IMouseClaim} from "../Viewer";

import * as rx from "rx";

export class MouseService {
    private _element: HTMLElement;

    private _mouseDown$: rx.Observable<MouseEvent>;
    private _mouseMove$: rx.Observable<MouseEvent>;
    private _mouseLeave$: rx.Observable<MouseEvent>;
    private _mouseUp$: rx.Observable<MouseEvent>;

    private _mouseWheel$: rx.Observable<MouseWheelEvent>;

    private _mouseDragStart$: rx.Observable<MouseEvent>;
    private _mouseDrag$: rx.Observable<MouseEvent>;
    private _mouseDragEnd$: rx.Observable<MouseEvent>;

    private _claimMouse$: rx.Subject<IMouseClaim> = new rx.Subject<IMouseClaim>();
    private _mouseOwner$: rx.ConnectableObservable<string>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._mouseDown$ = rx.Observable.fromEvent<MouseEvent>(element, "mousedown");
        this._mouseMove$ = rx.Observable.fromEvent<MouseEvent>(element, "mousemove");
        this._mouseLeave$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseleave");
        this._mouseUp$ = rx.Observable.fromEvent<MouseEvent>(element, "mouseup");

        this._mouseWheel$ = rx.Observable.fromEvent<MouseWheelEvent>(element, "wheel");

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
            .shareReplay(1)
            .publish();
        this._mouseOwner$.connect();
    }

    public claimMouse(name: string, zindex: number): void {
        this._claimMouse$.onNext({name: name, zindex: zindex});
    }

    public unclaimMouse(name: string): void {
        this._claimMouse$.onNext({name: name, zindex: null});
    }

    public filteredMouseEvent$(name: string, mouseObservable$: rx.Observable<MouseEvent>): rx.Observable<MouseEvent> {
        return mouseObservable$
            .combineLatest(this.mouseOwner$, (e: MouseEvent, owner: string): any => {
                return {e: e, owner: owner};
            }).filter((a: any) => {
                return a.owner === name;
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

    public get mouseWheel$(): rx.Observable<MouseWheelEvent> {
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
}

export default MouseService;
