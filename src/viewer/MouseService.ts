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

import {ViewportCoords} from "../Geo";
import {IMouseClaim} from "../Viewer";

export class MouseService {
    private _domContainer: EventTarget;
    private _canvasContainer: EventTarget;
    private _viewportCoords: ViewportCoords;

    private _activeSubject$: BehaviorSubject<boolean>;
    private _active$: Observable<boolean>;

    private _domMouseDown$: Observable<MouseEvent>;
    private _domMouseMove$: Observable<MouseEvent>;

    private _domMouseDragStart$: Observable<MouseEvent>;
    private _domMouseDrag$: Observable<MouseEvent>;
    private _domMouseDragEnd$: Observable<MouseEvent>;

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
    private _mouseDragEnd$: Observable<MouseEvent>;

    private _staticClick$: Observable<MouseEvent>;

    private _claimMouse$: Subject<IMouseClaim>;
    private _mouseOwner$: Observable<string>;

    constructor(
        container: EventTarget,
        canvasContainer: EventTarget,
        domContainer: EventTarget,
        doc: EventTarget,
        viewportCoords?: ViewportCoords) {

        this._canvasContainer = canvasContainer;
        this._domContainer = domContainer;
        this._viewportCoords = viewportCoords != null ? viewportCoords : new ViewportCoords();

        this._activeSubject$ = new BehaviorSubject<boolean>(false);

        this._active$ = this._activeSubject$
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();

        this._claimMouse$ = new Subject<IMouseClaim>();

        this._documentMouseMove$ = Observable.fromEvent<MouseEvent>(doc, "mousemove");
        this._documentMouseUp$ = Observable.fromEvent<MouseEvent>(doc, "mouseup");

        this._mouseDown$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mousedown");
        this._mouseLeave$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mouseleave");
        this._mouseMove$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mousemove");
        this._mouseUp$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mouseup");
        this._mouseOut$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mouseout");
        this._mouseOver$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mouseover");

        this._domMouseDown$ = Observable.fromEvent<MouseEvent>(domContainer, "mousedown");
        this._domMouseMove$ = Observable.fromEvent<MouseEvent>(domContainer, "mousemove");

        this._click$ = Observable.fromEvent<MouseEvent>(canvasContainer, "click");
        this._contextMenu$ = Observable.fromEvent<MouseEvent>(canvasContainer, "contextmenu");

        this._dblClick$ = Observable
            .merge(
                Observable.fromEvent<MouseEvent>(container, "click"),
                Observable.fromEvent<MouseEvent>(canvasContainer, "dblclick"))
            .bufferCount(3, 1)
            .filter(
                (events: MouseEvent[]): boolean => {
                    const event1: MouseEvent = events[0];
                    const event2: MouseEvent = events[1];
                    const event3: MouseEvent = events[2];

                    return event1.type === "click" &&
                        event2.type === "click" &&
                        event3.type === "dblclick" &&
                        (<HTMLElement>event1.target).parentNode === canvasContainer &&
                        (<HTMLElement>event2.target).parentNode === canvasContainer;
                })
            .map(
                (events: MouseEvent[]): MouseEvent => {
                    return events[2];
                })
            .share();

        Observable
            .merge(
                this._domMouseDown$,
                this._domMouseMove$,
                this._dblClick$,
                this._contextMenu$)
            .subscribe(
                (event: MouseEvent): void => {
                    event.preventDefault();
                });

        this._mouseWheel$ = Observable
            .merge(
                Observable.fromEvent<WheelEvent>(canvasContainer, "wheel"),
                Observable.fromEvent<WheelEvent>(domContainer, "wheel"));

        this._consistentContextMenu$ = Observable
            .merge(
                this._mouseDown$,
                this._mouseMove$,
                this._mouseOut$,
                this._mouseUp$,
                this._contextMenu$)
            .bufferCount(3, 1)
            .filter(
                (events: MouseEvent[]): boolean => {
                    // fire context menu on mouse up both on mac and windows
                    return events[0].type === "mousedown" &&
                        events[1].type === "contextmenu" &&
                        events[2].type === "mouseup";
                })
            .map(
                (events: MouseEvent[]): MouseEvent => {
                    return events[1];
                })
            .share();

        const dragStop$: Observable<MouseEvent> = Observable
            .merge(
                Observable.fromEvent<MouseEvent>(window, "blur"),
                this._documentMouseUp$
                    .filter(
                        (e: MouseEvent): boolean => {
                            return e.button === 0;
                        }))
            .share();

        const leftButtonDown$: Observable<MouseEvent> = this._mouseDown$
            .filter(
                (e: MouseEvent): boolean => {
                    return e.button === 0;
                })
            .share();

        this._mouseDragStart$ = leftButtonDown$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._documentMouseMove$
                        .takeUntil(dragStop$)
                        .take(1);
                })
            .share();

        this._mouseDrag$ = leftButtonDown$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._documentMouseMove$
                        .skip(1)
                        .takeUntil(dragStop$);
                })
            .share();

        this._mouseDragEnd$ = this._mouseDragStart$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return dragStop$.first();
                })
            .share();

        const domLeftButtonDown$: Observable<MouseEvent> = this._domMouseDown$
            .filter(
                (e: MouseEvent): boolean => {
                    return e.button === 0;
                })
            .share();

        this._domMouseDragStart$ = domLeftButtonDown$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._documentMouseMove$
                        .takeUntil(dragStop$)
                        .take(1);
                });

        this._domMouseDrag$ = domLeftButtonDown$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._documentMouseMove$
                        .skip(1)
                        .takeUntil(dragStop$);
                });

        this._domMouseDragEnd$ = this._domMouseDragStart$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return dragStop$.first();
                });

        this._staticClick$ = this._mouseDown$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._click$
                        .takeUntil(this._mouseMove$)
                        .take(1);
                });

        this._mouseDragStart$.subscribe();
        this._mouseDrag$.subscribe();
        this._mouseDragEnd$.subscribe();

        this._domMouseDragStart$.subscribe();
        this._domMouseDrag$.subscribe();
        this._domMouseDragEnd$.subscribe();

        this._staticClick$.subscribe();

        this._mouseOwner$ = this._claimMouse$
            .scan(
                (claims: {[key: string]: number}, mouseClaim: IMouseClaim): {[key: string]: number} => {
                    if (mouseClaim.zindex == null) {
                        delete claims[mouseClaim.name];
                    } else {
                        claims[mouseClaim.name] = mouseClaim.zindex;
                    }
                    return claims;
                },
                {})
            .map(
                (claims: {[key: string]: number}): string => {
                    let owner: string = null;
                    let curZ: number = -1;

                    for (const name in claims) {
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

        this._mouseOwner$.subscribe(() => { /* noop */ });
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

    public get domMouseDragEnd$(): Observable<MouseEvent> {
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

    public get mouseDragEnd$(): Observable<MouseEvent> {
        return this._mouseDragEnd$;
    }

    public get staticClick$(): Observable<MouseEvent> {
        return this._staticClick$;
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
            .map(
                (eo: [T, string]): T => {
                    return eo[0];
                });
    }
}

export default MouseService;
