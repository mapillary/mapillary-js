import {
    combineLatest as observableCombineLatest,
    concat as observableConcat,
    fromEvent as observableFromEvent,
    merge as observableMerge,
    of as observableOf,
    BehaviorSubject,
    Observable,
    Subject,
} from "rxjs";

import {
    bufferCount,
    distinctUntilChanged,
    filter,
    first,
    map,
    publishReplay,
    refCount,
    scan,
    share,
    startWith,
    switchMap,
    take,
    takeUntil,
    withLatestFrom,
} from "rxjs/operators";

import { MouseClaim } from "./interfaces/MouseClaim";
import { MousePixelDeferral } from "./interfaces/MousePixelDeferral";
import { SubscriptionHolder } from "../util/SubscriptionHolder";

type Button =
    | 0
    | 2;

// MouseEvent.button
const LEFT_BUTTON: Button = 0;
const RIGHT_BUTTON: Button = 2;

// MouseEvent.buttons
const BUTTONS_MAP = {
    [LEFT_BUTTON]: 1,
    [RIGHT_BUTTON]: 2
};

type PointerType =
    | "mouse"
    | "pen"
    | "touch";

interface FirefoxBrowser {
    InstallTrigger: undefined;
}

export class MouseService {
    private _activeSubject$: BehaviorSubject<boolean>;
    private _active$: Observable<boolean>;

    private _domMouseDown$: Observable<PointerEvent>;
    private _domMouseMove$: Observable<PointerEvent>;

    private _domMouseDragStart$: Observable<PointerEvent>;
    private _domMouseDrag$: Observable<PointerEvent>;
    private _domMouseDragEnd$: Observable<MouseEvent | FocusEvent>;

    private _documentMouseMove$: Observable<PointerEvent>;
    private _documentMouseUp$: Observable<PointerEvent>;

    private _mouseDown$: Observable<PointerEvent>;
    private _mouseEnter$: Observable<PointerEvent>;
    private _mouseMove$: Observable<PointerEvent>;
    private _mouseLeave$: Observable<PointerEvent>;
    private _mouseUp$: Observable<PointerEvent>;
    private _mouseOut$: Observable<PointerEvent>;
    private _mouseOver$: Observable<PointerEvent>;

    private _contextMenu$: Observable<MouseEvent>;
    private _consistentContextMenu$: Observable<MouseEvent>;
    private _click$: Observable<MouseEvent>;
    private _dblClick$: Observable<MouseEvent>;
    private _deferPixelClaims$: Subject<MousePixelDeferral>;
    private _deferPixels$: Observable<number>;
    private _proximateClick$: Observable<MouseEvent>;
    private _staticClick$: Observable<MouseEvent>;

    private _mouseWheel$: Observable<WheelEvent>;

    private _mouseDragStart$: Observable<PointerEvent>;
    private _mouseDrag$: Observable<PointerEvent>;
    private _mouseDragEnd$: Observable<PointerEvent | FocusEvent>;

    private _mouseRightDragStart$: Observable<PointerEvent>;
    private _mouseRightDrag$: Observable<PointerEvent>;
    private _mouseRightDragEnd$: Observable<PointerEvent | FocusEvent>;

    private _claimMouse$: Subject<MouseClaim>;
    private _claimWheel$: Subject<MouseClaim>;

    private _mouseOwner$: Observable<string>;
    private _wheelOwner$: Observable<string>;

    private _windowBlur$: Observable<FocusEvent>;

    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    constructor(
        container: EventTarget,
        canvasContainer: EventTarget,
        domContainer: EventTarget,
        doc: EventTarget) {

        const subs = this._subscriptions;

        this._activeSubject$ = new BehaviorSubject<boolean>(false);

        this._active$ = this._activeSubject$
            .pipe(
                distinctUntilChanged(),
                publishReplay(1),
                refCount());

        this._claimMouse$ = new Subject<MouseClaim>();
        this._claimWheel$ = new Subject<MouseClaim>();

        this._deferPixelClaims$ = new Subject<MousePixelDeferral>();
        this._deferPixels$ = this._deferPixelClaims$
            .pipe(
                scan(
                    (claims: { [key: string]: number }, claim: MousePixelDeferral): { [key: string]: number } => {
                        if (claim.deferPixels == null) {
                            delete claims[claim.name];
                        } else {
                            claims[claim.name] = claim.deferPixels;
                        }

                        return claims;
                    },
                    {}),
                map(
                    (claims: { [key: string]: number }): number => {
                        let deferPixelMax: number = -1;
                        for (const key in claims) {
                            if (!claims.hasOwnProperty(key)) {
                                continue;
                            }

                            const deferPixels: number = claims[key];
                            if (deferPixels > deferPixelMax) {
                                deferPixelMax = deferPixels;
                            }
                        }

                        return deferPixelMax;
                    }),
                startWith(-1),
                publishReplay(1),
                refCount());

        subs.push(this._deferPixels$.subscribe((): void => { /* noop */ }));

        this._documentMouseMove$ =
            observableFromEvent<PointerEvent>(doc, "pointermove")
                .pipe(filter(this._isMousePen));
        this._documentMouseUp$ =
            observableFromEvent<PointerEvent>(doc, "pointerup")
                .pipe(filter(this._isMousePen));

        this._mouseDown$ =
            observableFromEvent<PointerEvent>(canvasContainer, "pointerdown")
                .pipe(filter(this._isMousePen));
        this._mouseEnter$ =
            observableFromEvent<PointerEvent>(canvasContainer, "pointerenter")
                .pipe(filter(this._isMousePen));
        this._mouseLeave$ =
            observableFromEvent<PointerEvent>(canvasContainer, "pointerleave")
                .pipe(filter(this._isMousePen));
        this._mouseMove$ =
            observableFromEvent<PointerEvent>(canvasContainer, "pointermove")
                .pipe(filter(this._isMousePen));
        this._mouseUp$ =
            observableFromEvent<PointerEvent>(canvasContainer, "pointerup")
                .pipe(filter(this._isMousePen));
        this._mouseOut$ =
            observableFromEvent<PointerEvent>(canvasContainer, "pointerout")
                .pipe(filter(this._isMousePen));
        this._mouseOver$ =
            observableFromEvent<PointerEvent>(canvasContainer, "pointerover")
                .pipe(filter(this._isMousePen));

        this._domMouseDown$ =
            observableFromEvent<PointerEvent>(domContainer, "pointerdown")
                .pipe(filter(this._isMousePen));
        this._domMouseMove$ =
            observableFromEvent<PointerEvent>(domContainer, "pointermove")
                .pipe(filter(this._isMousePen));

        this._click$ =
            observableFromEvent<MouseEvent>(canvasContainer, "click");
        this._contextMenu$ =
            observableFromEvent<MouseEvent>(canvasContainer, "contextmenu");
        this._windowBlur$ =
            observableFromEvent<FocusEvent>(window, "blur");

        this._dblClick$ = observableMerge(
            observableFromEvent<MouseEvent>(container, "click"),
            observableFromEvent<MouseEvent>(canvasContainer, "dblclick"))
            .pipe(
                bufferCount(3, 1),
                filter(
                    (events: MouseEvent[]): boolean => {
                        const event1: MouseEvent = events[0];
                        const event2: MouseEvent = events[1];
                        const event3: MouseEvent = events[2];

                        return event1.type === "click" &&
                            event2.type === "click" &&
                            event3.type === "dblclick" &&
                            (<HTMLElement>event1.target).parentNode === canvasContainer &&
                            (<HTMLElement>event2.target).parentNode === canvasContainer;
                    }),
                map(
                    (events: MouseEvent[]): MouseEvent => {
                        return events[2];
                    }),
                share());

        subs.push(observableMerge(
            this._domMouseDown$,
            this._domMouseMove$,
            this._dblClick$,
            this._contextMenu$)
            .subscribe(
                (event: MouseEvent): void => {
                    event.preventDefault();
                }));

        this._mouseWheel$ = observableMerge(
            observableFromEvent<WheelEvent>(canvasContainer, "wheel"),
            observableFromEvent<WheelEvent>(domContainer, "wheel"))
            .pipe(share());

        this._consistentContextMenu$ =
            observableMerge(
                this._mouseDown$,
                this._mouseMove$,
                this._mouseOut$,
                this._mouseUp$,
                this._contextMenu$)
                .pipe(
                    bufferCount(3, 1),
                    filter(
                        (events: MouseEvent[]): boolean => {
                            // fire context menu on mouse up both on mac and windows
                            return events[0].type === "pointerdown" &&
                                events[1].type === "contextmenu" &&
                                events[2].type === "pointerup";
                        }),
                    map(
                        (events: MouseEvent[]): MouseEvent => {
                            return events[1];
                        }),
                    share());

        const dragStop$ =
            observableMerge(
                this._windowBlur$,
                this._documentMouseMove$
                    .pipe(
                        filter(
                            (e: PointerEvent): boolean => {
                                return this._buttonReleased(e, LEFT_BUTTON);
                            })),
                this._documentMouseUp$
                    .pipe(
                        filter(
                            (e: PointerEvent): boolean => {
                                return this._mouseButton(e) === LEFT_BUTTON;
                            })))
                .pipe(share());

        const mouseDragInitiate$ =
            this._createMouseDragInitiate$(
                LEFT_BUTTON,
                this._mouseDown$,
                dragStop$,
                true)
                .pipe(share());

        this._mouseDragStart$ =
            this._createMouseDragStart$(mouseDragInitiate$)
                .pipe(share());
        this._mouseDrag$ =
            this._createMouseDrag$(mouseDragInitiate$, dragStop$)
                .pipe(share());
        this._mouseDragEnd$ =
            this._createMouseDragEnd$(this._mouseDragStart$, dragStop$)
                .pipe(share());

        const domMouseDragInitiate$ =
            this._createMouseDragInitiate$(
                LEFT_BUTTON,
                this._domMouseDown$,
                dragStop$,
                false)
                .pipe(share());

        this._domMouseDragStart$ =
            this._createMouseDragStart$(domMouseDragInitiate$)
                .pipe(share());
        this._domMouseDrag$ =
            this._createMouseDrag$(domMouseDragInitiate$, dragStop$)
                .pipe(share());
        this._domMouseDragEnd$ =
            this._createMouseDragEnd$(this._domMouseDragStart$, dragStop$)
                .pipe(share());

        const rightDragStop$ =
            observableMerge(
                this._windowBlur$,
                this._documentMouseMove$.pipe(
                    filter(
                        (e: PointerEvent): boolean => {
                            return this._buttonReleased(e, RIGHT_BUTTON);
                        })),
                this._documentMouseUp$.pipe(
                    filter(
                        (e: PointerEvent): boolean => {
                            return this._mouseButton(e) === RIGHT_BUTTON;
                        })))
                .pipe(share());

        const mouseRightDragInitiate$ =
            this._createMouseDragInitiate$(
                RIGHT_BUTTON,
                this._mouseDown$,
                rightDragStop$,
                true)
                .pipe(share());

        this._mouseRightDragStart$ =
            this._createMouseDragStart$(mouseRightDragInitiate$)
                .pipe(share());
        this._mouseRightDrag$ =
            this._createMouseDrag$(mouseRightDragInitiate$, rightDragStop$)
                .pipe(share());
        this._mouseRightDragEnd$ =
            this._createMouseDragEnd$(this._mouseRightDragStart$, rightDragStop$)
                .pipe(share());

        this._proximateClick$ = this._mouseDown$
            .pipe(
                switchMap(
                    (mouseDown: PointerEvent): Observable<MouseEvent> => {
                        return this._click$.pipe(
                            takeUntil(this._createDeferredMouseMove$(mouseDown, this._documentMouseMove$)),
                            take(1));
                    }),
                share());

        this._staticClick$ = this._mouseDown$
            .pipe(
                switchMap(
                    (): Observable<MouseEvent> => {
                        return this._click$.pipe(
                            takeUntil(this._documentMouseMove$),
                            take(1));
                    }),
                share());

        subs.push(this._mouseDragStart$.subscribe());
        subs.push(this._mouseDrag$.subscribe());
        subs.push(this._mouseDragEnd$.subscribe());

        subs.push(this._domMouseDragStart$.subscribe());
        subs.push(this._domMouseDrag$.subscribe());
        subs.push(this._domMouseDragEnd$.subscribe());

        subs.push(this._mouseRightDragStart$.subscribe());
        subs.push(this._mouseRightDrag$.subscribe());
        subs.push(this._mouseRightDragEnd$.subscribe());

        subs.push(this._staticClick$.subscribe());

        this._mouseOwner$ = this._createOwner$(this._claimMouse$)
            .pipe(
                publishReplay(1),
                refCount());

        this._wheelOwner$ = this._createOwner$(this._claimWheel$)
            .pipe(
                publishReplay(1),
                refCount());

        subs.push(this._mouseOwner$.subscribe(() => { /* noop */ }));
        subs.push(this._wheelOwner$.subscribe(() => { /* noop */ }));
    }

    public get active$(): Observable<boolean> {
        return this._active$;
    }

    public get activate$(): Subject<boolean> {
        return this._activeSubject$;
    }

    public get documentMouseMove$(): Observable<MouseEvent> {
        return this._documentMouseMove$;
    }

    public get documentMouseUp$(): Observable<MouseEvent> {
        return this._documentMouseUp$;
    }

    public get domMouseDragStart$(): Observable<MouseEvent> {
        return this._domMouseDragStart$;
    }

    public get domMouseDrag$(): Observable<MouseEvent> {
        return this._domMouseDrag$;
    }

    public get domMouseDragEnd$(): Observable<MouseEvent | FocusEvent> {
        return this._domMouseDragEnd$;
    }

    public get domMouseDown$(): Observable<MouseEvent> {
        return this._domMouseDown$;
    }

    public get domMouseMove$(): Observable<MouseEvent> {
        return this._domMouseMove$;
    }

    public get mouseOwner$(): Observable<string> {
        return this._mouseOwner$;
    }

    public get mouseDown$(): Observable<MouseEvent> {
        return this._mouseDown$;
    }

    public get mouseEnter$(): Observable<MouseEvent> {
        return this._mouseEnter$;
    }

    public get mouseMove$(): Observable<MouseEvent> {
        return this._mouseMove$;
    }

    public get mouseLeave$(): Observable<MouseEvent> {
        return this._mouseLeave$;
    }

    public get mouseOut$(): Observable<MouseEvent> {
        return this._mouseOut$;
    }

    public get mouseOver$(): Observable<MouseEvent> {
        return this._mouseOver$;
    }

    public get mouseUp$(): Observable<MouseEvent> {
        return this._mouseUp$;
    }

    public get click$(): Observable<MouseEvent> {
        return this._click$;
    }

    public get dblClick$(): Observable<MouseEvent> {
        return this._dblClick$;
    }

    public get contextMenu$(): Observable<MouseEvent> {
        return this._consistentContextMenu$;
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

    public get mouseDragEnd$(): Observable<MouseEvent | FocusEvent> {
        return this._mouseDragEnd$;
    }

    public get mouseRightDragStart$(): Observable<MouseEvent> {
        return this._mouseRightDragStart$;
    }

    public get mouseRightDrag$(): Observable<MouseEvent> {
        return this._mouseRightDrag$;
    }

    public get mouseRightDragEnd$(): Observable<MouseEvent | FocusEvent> {
        return this._mouseRightDragEnd$;
    }

    public get proximateClick$(): Observable<MouseEvent> {
        return this._proximateClick$;
    }

    public get staticClick$(): Observable<MouseEvent> {
        return this._staticClick$;
    }

    public get windowBlur$(): Observable<FocusEvent> {
        return this._windowBlur$;
    }

    public dispose(): void {
        this._subscriptions.unsubscribe();
    }

    public claimMouse(name: string, zindex: number): void {
        this._claimMouse$.next({ name: name, zindex: zindex });
    }

    public unclaimMouse(name: string): void {
        this._claimMouse$.next({ name: name, zindex: null });
    }

    public deferPixels(name: string, deferPixels: number): void {
        this._deferPixelClaims$.next({ name: name, deferPixels: deferPixels });
    }

    public undeferPixels(name: string): void {
        this._deferPixelClaims$.next({ name: name, deferPixels: null });
    }

    public claimWheel(name: string, zindex: number): void {
        this._claimWheel$.next({ name: name, zindex: zindex });
    }

    public unclaimWheel(name: string): void {
        this._claimWheel$.next({ name: name, zindex: null });
    }

    public filtered$<T>(name: string, observable$: Observable<T>): Observable<T> {
        return this._filtered(name, observable$, this._mouseOwner$);
    }

    public filteredWheel$<T>(name: string, observable$: Observable<T>): Observable<T> {
        return this._filtered(name, observable$, this._wheelOwner$);
    }

    private _createDeferredMouseMove$(
        origin: PointerEvent,
        mouseMove$: Observable<PointerEvent>): Observable<PointerEvent> {
        return mouseMove$.pipe(
            map(
                (mouseMove: PointerEvent): [PointerEvent, number] => {
                    const deltaX: number = mouseMove.clientX - origin.clientX;
                    const deltaY: number = mouseMove.clientY - origin.clientY;

                    return [mouseMove, Math.sqrt(deltaX * deltaX + deltaY * deltaY)];
                }),
            withLatestFrom(this._deferPixels$),
            filter(
                ([[, delta], deferPixels]: [[PointerEvent, number], number]): boolean => {
                    return delta > deferPixels;
                }),
            map(
                ([[mouseMove]]: [[PointerEvent, number], number]): PointerEvent => {
                    return mouseMove;
                }));
    }

    private _createMouseDrag$(
        mouseDragStartInitiate$: Observable<[PointerEvent, PointerEvent]>,
        stop$: Observable<Event>): Observable<PointerEvent> {

        return mouseDragStartInitiate$.pipe(
            map(
                ([, mouseMove]: [PointerEvent, PointerEvent]): PointerEvent => {
                    return mouseMove;
                }),
            switchMap(
                (mouseMove: PointerEvent): Observable<PointerEvent> => {
                    return observableConcat(
                        observableOf(mouseMove),
                        this._documentMouseMove$).pipe(
                            takeUntil(stop$));
                }));
    }

    private _createMouseDragEnd$<T>(mouseDragStart$: Observable<PointerEvent>, stop$: Observable<T>): Observable<T> {
        return mouseDragStart$.pipe(
            switchMap(
                (): Observable<T> => {
                    return stop$.pipe(first());
                }));
    }

    private _createMouseDragStart$(mouseDragStartInitiate$: Observable<[PointerEvent, PointerEvent]>): Observable<PointerEvent> {
        return mouseDragStartInitiate$.pipe(
            map(
                ([mouseDown]: [PointerEvent, PointerEvent]): PointerEvent => {
                    return mouseDown;
                }));
    }

    private _createMouseDragInitiate$(
        button: number,
        mouseDown$: Observable<PointerEvent>,
        stop$: Observable<Event>,
        defer: boolean): Observable<[PointerEvent, PointerEvent]> {

        return mouseDown$.pipe(
            filter(
                (mouseDown: PointerEvent): boolean => {
                    return this._mouseButton(mouseDown) === button;
                }),
            switchMap(
                (mouseDown: PointerEvent): Observable<[PointerEvent, PointerEvent]> => {
                    return observableCombineLatest(
                        observableOf(mouseDown),
                        defer ?
                            this._createDeferredMouseMove$(mouseDown, this._documentMouseMove$) :
                            this._documentMouseMove$).pipe(
                                takeUntil(stop$),
                                take(1));
                }));
    }

    private _createOwner$(claim$: Observable<MouseClaim>): Observable<string> {
        return claim$.pipe(
            scan(
                (claims: { [key: string]: number }, claim: MouseClaim): { [key: string]: number } => {
                    if (claim.zindex == null) {
                        delete claims[claim.name];
                    } else {
                        claims[claim.name] = claim.zindex;
                    }

                    return claims;
                },
                {}),
            map(
                (claims: { [key: string]: number }): string => {
                    let owner: string = null;
                    let zIndexMax: number = -1;

                    for (const name in claims) {
                        if (!claims.hasOwnProperty(name)) {
                            continue;
                        }

                        if (claims[name] > zIndexMax) {
                            zIndexMax = claims[name];
                            owner = name;
                        }
                    }

                    return owner;
                }),
            startWith(null));
    }

    private _filtered<T>(
        name: string,
        observable$: Observable<T>,
        owner$: Observable<string>): Observable<T> {

        return observable$.pipe(
            withLatestFrom(owner$),
            filter(
                ([, owner]: [T, string]): boolean => {
                    return owner === name;
                }),
            map(
                ([item]: [T, string]): T => {
                    return item;
                }));
    }

    private _mouseButton(event: PointerEvent): number {
        const upOrDown = event.type === "pointerdown" || event.type === "pointerup";
        const InstallTrigger = (<FirefoxBrowser><unknown>window).InstallTrigger;
        if (upOrDown &&
            typeof InstallTrigger !== 'undefined' &&
            event.button === RIGHT_BUTTON && event.ctrlKey &&
            window.navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
            // Fix for the fact that Firefox (detected by InstallTrigger)
            // on Mac determines e.button = 2 when using Control + left click.
            return LEFT_BUTTON;
        }
        return event.button;
    }

    private _buttonReleased(event: PointerEvent, button: Button): boolean {
        // Right button `mouseup` is not fired in
        // Chrome on Mac outside the window or iframe. If
        // the button is no longer pressed during move
        // it may have been released and drag stop
        // should be emitted.
        const flag = BUTTONS_MAP[button];
        return event.buttons === undefined || (event.buttons & flag) !== flag;
    }

    private _isMousePen(event: PointerEvent): boolean {
        const type = <PointerType>event.pointerType;
        return type === "mouse" || type === "pen";
    }
}
