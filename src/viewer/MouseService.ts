import {
    concat as observableConcat,
    merge as observableMerge,
    combineLatest as observableCombineLatest,
    fromEvent as observableFromEvent,
    of as observableOf,
    BehaviorSubject,
    Observable,
    Subject,
} from "rxjs";

import {
    switchMap,
    distinctUntilChanged,
    publishReplay,
    refCount,
    scan,
    map,
    startWith,
    filter,
    share,
    takeUntil,
    take,
    withLatestFrom,
    first,
    bufferCount,
} from "rxjs/operators";

import {
    IMouseClaim,
    IMouseDeferPixels,
} from "../Viewer";

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

    private _deferPixelClaims$: Subject<IMouseDeferPixels>;
    private _deferPixels$: Observable<number>;
    private _proximateClick$: Observable<MouseEvent>;
    private _staticClick$: Observable<MouseEvent>;

    private _claimMouse$: Subject<IMouseClaim>;
    private _claimWheel$: Subject<IMouseClaim>;

    private _mouseOwner$: Observable<string>;
    private _wheelOwner$: Observable<string>;

    constructor(
        container: EventTarget,
        canvasContainer: EventTarget,
        domContainer: EventTarget,
        doc: EventTarget) {

        this._activeSubject$ = new BehaviorSubject<boolean>(false);

        this._active$ = this._activeSubject$.pipe(
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        this._claimMouse$ = new Subject<IMouseClaim>();
        this._claimWheel$ = new Subject<IMouseClaim>();

        this._deferPixelClaims$ = new Subject<IMouseDeferPixels>();
        this._deferPixels$ = this._deferPixelClaims$.pipe(
            scan(
                (claims: { [key: string]: number }, claim: IMouseDeferPixels): { [key: string]: number } => {
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

        this._deferPixels$.subscribe((): void => { /* noop */ });

        this._documentMouseMove$ = observableFromEvent<MouseEvent>(doc, "mousemove");
        this._documentMouseUp$ = observableFromEvent<MouseEvent>(doc, "mouseup");

        this._mouseDown$ = observableFromEvent<MouseEvent>(canvasContainer, "mousedown");
        this._mouseLeave$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseleave");
        this._mouseMove$ = observableFromEvent<MouseEvent>(canvasContainer, "mousemove");
        this._mouseUp$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseup");
        this._mouseOut$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseout");
        this._mouseOver$ = observableFromEvent<MouseEvent>(canvasContainer, "mouseover");

        this._domMouseDown$ = observableFromEvent<MouseEvent>(domContainer, "mousedown");
        this._domMouseMove$ = observableFromEvent<MouseEvent>(domContainer, "mousemove");

        this._click$ = observableFromEvent<MouseEvent>(canvasContainer, "click");
        this._contextMenu$ = observableFromEvent<MouseEvent>(canvasContainer, "contextmenu");

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

        observableMerge(
                this._domMouseDown$,
                this._domMouseMove$,
                this._dblClick$,
                this._contextMenu$)
            .subscribe(
                (event: MouseEvent): void => {
                    event.preventDefault();
                });

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
                observableFromEvent<FocusEvent>(window, "blur"),
                this._documentMouseUp$.pipe(
                    filter(
                        (e: MouseEvent): boolean => {
                            return e.button === 0;
                        }))).pipe(
            share());

        const mouseDragInitiate$: Observable<[MouseEvent, MouseEvent]> =
            this._createMouseDragInitiate$(this._mouseDown$, dragStop$, true).pipe(share());

        this._mouseDragStart$ = this._createMouseDragStart$(mouseDragInitiate$).pipe(share());
        this._mouseDrag$ = this._createMouseDrag$(mouseDragInitiate$, dragStop$).pipe(share());
        this._mouseDragEnd$ = this._createMouseDragEnd$(this._mouseDragStart$, dragStop$).pipe(share());

        const domMouseDragInitiate$: Observable<[MouseEvent, MouseEvent]> =
            this._createMouseDragInitiate$(this._domMouseDown$, dragStop$, false).pipe(share());

        this._domMouseDragStart$ = this._createMouseDragStart$(domMouseDragInitiate$).pipe(share());
        this._domMouseDrag$ = this._createMouseDrag$(domMouseDragInitiate$, dragStop$).pipe(share());
        this._domMouseDragEnd$ = this._createMouseDragEnd$(this._domMouseDragStart$, dragStop$).pipe(share());

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
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._click$.pipe(
                        takeUntil(this._documentMouseMove$),
                        take(1));
                }),
            share());

        this._mouseDragStart$.subscribe();
        this._mouseDrag$.subscribe();
        this._mouseDragEnd$.subscribe();

        this._domMouseDragStart$.subscribe();
        this._domMouseDrag$.subscribe();
        this._domMouseDragEnd$.subscribe();

        this._staticClick$.subscribe();

        this._mouseOwner$ = this._createOwner$(this._claimMouse$).pipe(
            publishReplay(1),
            refCount());

        this._wheelOwner$ = this._createOwner$(this._claimWheel$).pipe(
            publishReplay(1),
            refCount());

        this._mouseOwner$.subscribe(() => { /* noop */ });
        this._wheelOwner$.subscribe(() => { /* noop */ });
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

    public get proximateClick$(): Observable<MouseEvent> {
        return this._proximateClick$;
    }

    public get staticClick$(): Observable<MouseEvent> {
        return this._staticClick$;
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
        this._claimWheel$.next({name: name, zindex: zindex});
    }

    public unclaimWheel(name: string): void {
        this._claimWheel$.next({name: name, zindex: null});
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
                ([[mouseMove, delta], deferPixels]: [[MouseEvent, number], number]): boolean => {
                    return delta > deferPixels;
                }),
            map(
                ([[mouseMove, delta], deferPixels]: [[MouseEvent, number], number]): MouseEvent => {
                    return mouseMove;
                }));
    }

    private _createMouseDrag$(
        mouseDragStartInitiate$: Observable<[MouseEvent, MouseEvent]>,
        stop$: Observable<Event>): Observable<MouseEvent> {

        return mouseDragStartInitiate$.pipe(
            map(
                ([mouseDown, mouseMove]: [MouseEvent, MouseEvent]): MouseEvent => {
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
                (event: MouseEvent): Observable<T> => {
                    return stop$.pipe(first());
                }));
    }

    private _createMouseDragStart$(mouseDragStartInitiate$: Observable<[MouseEvent, MouseEvent]>): Observable<MouseEvent> {
        return mouseDragStartInitiate$.pipe(
            map(
                ([mouseDown, mouseMove]: [MouseEvent, MouseEvent]): MouseEvent => {
                    return mouseDown;
                }));
    }

    private _createMouseDragInitiate$(
        mouseDown$: Observable<MouseEvent>,
        stop$: Observable<Event>,
        defer: boolean): Observable<[MouseEvent, MouseEvent]> {

        return mouseDown$.pipe(
            filter(
                (mouseDown: MouseEvent): boolean => {
                    return mouseDown.button === 0;
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

    private _createOwner$(claim$: Observable<IMouseClaim>): Observable<string> {
        return claim$.pipe(
            scan(
                (claims: { [key: string]: number }, claim: IMouseClaim): { [key: string]: number } => {
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
                ([item, owner]: [T, string]): boolean => {
                    return owner === name;
                }),
            map(
                ([item, owner]: [T, string]): T => {
                    return item;
                }));
    }
}

export default MouseService;
