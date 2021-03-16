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
import { SubscriptionHolder } from "../utils/SubscriptionHolder";

type Button = 0 | 2;

// MouseEvent.button
const LEFT_BUTTON: Button = 0;
const RIGHT_BUTTON: Button = 2;

// MouseEvent.buttons
const BUTTONS_MAP = {
    [LEFT_BUTTON]: 1,
    [RIGHT_BUTTON]: 2
};

interface FirefoxBrowser {
    InstallTrigger: undefined;
}

export class MouseService {
    private _activeSubject$: BehaviorSubject<boolean>;
    private _active$: Observable<boolean>;

    private _domMouseDown$: Observable<MouseEvent>;
    private _domMouseMove$: Observable<MouseEvent>;

    private _domMouseDragStart$: Observable<MouseEvent>;
    private _domMouseDrag$: Observable<MouseEvent>;
    private _domMouseDragEnd$: Observable<MouseEvent | FocusEvent>;

    private _documentMouseMove$: Observable<MouseEvent>;
    private _documentMouseUp$: Observable<MouseEvent>;

    private _mouseDown$: Observable<MouseEvent>;
    private _mouseEnter$: Observable<MouseEvent>;
    private _mouseMove$: Observable<MouseEvent>;
    private _mouseLeave$: Observable<MouseEvent>;
    private _mouseUp$: Observable<MouseEvent>;
    private _mouseOut$: Observable<MouseEvent>;
    private _mouseOver$: Observable<MouseEvent>;

    private _contextMenu$: Observable<MouseEvent>;
    private _consistentContextMenu$: Observable<MouseEvent>;
    private _click$: Observable<MouseEvent>;
    private _dblClick$: Observable<MouseEvent>;

    private _mouseWheel$: Observable<WheelEvent>;

    private _mouseDragStart$: Observable<MouseEvent>;
    private _mouseDrag$: Observable<MouseEvent>;
    private _mouseDragEnd$: Observable<MouseEvent | FocusEvent>;

    private _mouseRightDragStart$: Observable<MouseEvent>;
    private _mouseRightDrag$: Observable<MouseEvent>;
    private _mouseRightDragEnd$: Observable<MouseEvent | FocusEvent>;

    private _deferPixelClaims$: Subject<MousePixelDeferral>;
    private _deferPixels$: Observable<number>;
    private _proximateClick$: Observable<MouseEvent>;
    private _staticClick$: Observable<MouseEvent>;

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

        this._active$ = this._activeSubject$.pipe(
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        this._claimMouse$ = new Subject<MouseClaim>();
        this._claimWheel$ = new Subject<MouseClaim>();

        this._deferPixelClaims$ = new Subject<MousePixelDeferral>();
        this._deferPixels$ = this._deferPixelClaims$.pipe(
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

        this._documentMouseMove$ = observableFromEvent<MouseEvent>(doc, "mousemove");
        this._documentMouseUp$ = observableFromEvent<MouseEvent>(doc, "mouseup");

        this._mouseDown$ = observableFromEvent<MouseEvent>(canvasContainer, "mousedown");
        this._mouseEnter$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseenter");
        this._mouseLeave$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseleave");
        this._mouseMove$ = observableFromEvent<MouseEvent>(canvasContainer, "mousemove");
        this._mouseUp$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseup");
        this._mouseOut$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseout");
        this._mouseOver$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseover");

        this._domMouseDown$ = observableFromEvent<MouseEvent>(domContainer, "mousedown");
        this._domMouseMove$ = observableFromEvent<MouseEvent>(domContainer, "mousemove");

        this._click$ = observableFromEvent<MouseEvent>(canvasContainer, "click");
        this._contextMenu$ = observableFromEvent<MouseEvent>(canvasContainer, "contextmenu");
        this._windowBlur$ = observableFromEvent<FocusEvent>(window, "blur");

        this._dblClick$ = observableMerge(
            observableFromEvent<MouseEvent>(container, "click"),
            observableFromEvent<MouseEvent>(canvasContainer, "dblclick")).pipe(
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
            observableFromEvent<WheelEvent>(domContainer, "wheel")).pipe(
                share());

        this._consistentContextMenu$ = observableMerge(
            this._mouseDown$,
            this._mouseMove$,
            this._mouseOut$,
            this._mouseUp$,
            this._contextMenu$).pipe(
                bufferCount(3, 1),
                filter(
                    (events: MouseEvent[]): boolean => {
                        // fire context menu on mouse up both on mac and windows
                        return events[0].type === "mousedown" &&
                            events[1].type === "contextmenu" &&
                            events[2].type === "mouseup";
                    }),
                map(
                    (events: MouseEvent[]): MouseEvent => {
                        return events[1];
                    }),
                share());

        const dragStop$: Observable<MouseEvent | FocusEvent> = observableMerge(
            this._windowBlur$,
            this._documentMouseMove$.pipe(
                filter(
                    (e: MouseEvent): boolean => {
                        return this._buttonReleased(e, LEFT_BUTTON);
                    })),
            this._documentMouseUp$.pipe(
                filter(
                    (e: MouseEvent): boolean => {
                        return this._mouseButton(e) === LEFT_BUTTON;
                    }))).pipe(
                        share());

        const mouseDragInitiate$: Observable<[MouseEvent, MouseEvent]> =
            this._createMouseDragInitiate$(LEFT_BUTTON, this._mouseDown$, dragStop$, true).pipe(share());

        this._mouseDragStart$ = this._createMouseDragStart$(mouseDragInitiate$).pipe(share());
        this._mouseDrag$ = this._createMouseDrag$(mouseDragInitiate$, dragStop$).pipe(share());
        this._mouseDragEnd$ = this._createMouseDragEnd$(this._mouseDragStart$, dragStop$).pipe(share());

        const domMouseDragInitiate$: Observable<[MouseEvent, MouseEvent]> =
            this._createMouseDragInitiate$(
                LEFT_BUTTON,
                this._domMouseDown$,
                dragStop$,
                false)
                .pipe(share());

        this._domMouseDragStart$ = this._createMouseDragStart$(domMouseDragInitiate$).pipe(share());
        this._domMouseDrag$ = this._createMouseDrag$(domMouseDragInitiate$, dragStop$).pipe(share());
        this._domMouseDragEnd$ = this._createMouseDragEnd$(this._domMouseDragStart$, dragStop$).pipe(share());

        const rightDragStop$: Observable<MouseEvent | FocusEvent> =
            observableMerge(
                this._windowBlur$,
                this._documentMouseMove$.pipe(
                    filter(
                        (e: MouseEvent): boolean => {
                            return this._buttonReleased(e, RIGHT_BUTTON);
                        })),
                this._documentMouseUp$.pipe(
                    filter(
                        (e: MouseEvent): boolean => {
                            return this._mouseButton(e) === RIGHT_BUTTON;
                        }))).pipe(
                            share());

        const mouseRightDragInitiate$: Observable<[MouseEvent, MouseEvent]> =
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

        this._proximateClick$ = this._mouseDown$.pipe(
            switchMap(
                (mouseDown: MouseEvent): Observable<MouseEvent> => {
                    return this._click$.pipe(
                        takeUntil(this._createDeferredMouseMove$(mouseDown, this._documentMouseMove$)),
                        take(1));
                }),
            share());

        this._staticClick$ = this._mouseDown$.pipe(
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

        this._mouseOwner$ = this._createOwner$(this._claimMouse$).pipe(
            publishReplay(1),
            refCount());

        this._wheelOwner$ = this._createOwner$(this._claimWheel$).pipe(
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
        origin: MouseEvent,
        mouseMove$: Observable<MouseEvent>): Observable<MouseEvent> {
        return mouseMove$.pipe(
            map(
                (mouseMove: MouseEvent): [MouseEvent, number] => {
                    const deltaX: number = mouseMove.clientX - origin.clientX;
                    const deltaY: number = mouseMove.clientY - origin.clientY;

                    return [mouseMove, Math.sqrt(deltaX * deltaX + deltaY * deltaY)];
                }),
            withLatestFrom(this._deferPixels$),
            filter(
                ([[, delta], deferPixels]: [[MouseEvent, number], number]): boolean => {
                    return delta > deferPixels;
                }),
            map(
                ([[mouseMove]]: [[MouseEvent, number], number]): MouseEvent => {
                    return mouseMove;
                }));
    }

    private _createMouseDrag$(
        mouseDragStartInitiate$: Observable<[MouseEvent, MouseEvent]>,
        stop$: Observable<Event>): Observable<MouseEvent> {

        return mouseDragStartInitiate$.pipe(
            map(
                ([, mouseMove]: [MouseEvent, MouseEvent]): MouseEvent => {
                    return mouseMove;
                }),
            switchMap(
                (mouseMove: MouseEvent): Observable<MouseEvent> => {
                    return observableConcat(
                        observableOf(mouseMove),
                        this._documentMouseMove$).pipe(
                            takeUntil(stop$));
                }));
    }

    private _createMouseDragEnd$<T>(mouseDragStart$: Observable<MouseEvent>, stop$: Observable<T>): Observable<T> {
        return mouseDragStart$.pipe(
            switchMap(
                (): Observable<T> => {
                    return stop$.pipe(first());
                }));
    }

    private _createMouseDragStart$(mouseDragStartInitiate$: Observable<[MouseEvent, MouseEvent]>): Observable<MouseEvent> {
        return mouseDragStartInitiate$.pipe(
            map(
                ([mouseDown]: [MouseEvent, MouseEvent]): MouseEvent => {
                    return mouseDown;
                }));
    }

    private _createMouseDragInitiate$(
        button: number,
        mouseDown$: Observable<MouseEvent>,
        stop$: Observable<Event>,
        defer: boolean): Observable<[MouseEvent, MouseEvent]> {

        return mouseDown$.pipe(
            filter(
                (mouseDown: MouseEvent): boolean => {
                    return this._mouseButton(mouseDown) === button;
                }),
            switchMap(
                (mouseDown: MouseEvent): Observable<[MouseEvent, MouseEvent]> => {
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

    private _filtered<T>(name: string, observable$: Observable<T>, owner$: Observable<string>): Observable<T> {
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

    private _mouseButton(event: MouseEvent): number {
        const upOrDown = event.type === "mousedown" || event.type === "mouseup";
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

    private _buttonReleased(e: MouseEvent, button: Button): boolean {
        // Right button `mouseup` is not fired in
        // Chrome on Mac outside the window or iframe. If
        // the button is no longer pressed during move
        // it may have been released and drag stop
        // should be emitted.
        const flag = BUTTONS_MAP[button];
        return e.buttons === undefined || (e.buttons & flag) !== flag;
    }
}
