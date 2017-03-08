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
    private _container: HTMLElement;
    private _canvasContainer: HTMLElement;

    private _activeSubject$: BehaviorSubject<boolean>;
    private _active$: Observable<boolean>;

    private _documentMouseDown$: Observable<MouseEvent>;
    private _documentMouseMove$: Observable<MouseEvent>;
    private _documentMouseUp$: Observable<MouseEvent>;

    private _documentCanvasMouseDown$: Observable<MouseEvent>;
    private _documentCanvasMouseMove$: Observable<MouseEvent>;
    private _documentCanvasMouseDragStart$: Observable<MouseEvent>;
    private _documentCanvasMouseDrag$: Observable<MouseEvent>;
    private _documentCanvasMouseDragEnd$: Observable<MouseEvent>;

    private _mouseDown$: Observable<MouseEvent>;
    private _mouseMoveOperation$: Subject<IMouseMoveOperation>;
    private _mouseMove$: Observable<MouseEvent>;
    private _mouseLeave$: Observable<MouseEvent>;
    private _mouseUp$: Observable<MouseEvent>;
    private _mouseOut$: Observable<MouseEvent>;

    private _contextMenu$: Observable<MouseEvent>;
    private _click$: Observable<MouseEvent>;

    private _mouseWheel$: Observable<WheelEvent>;

    private _mouseDragStart$: Observable<MouseEvent>;
    private _mouseDrag$: Observable<MouseEvent>;
    private _mouseDragEnd$: Observable<MouseEvent>;

    private _staticClick$: Observable<MouseEvent>;

    private _claimMouse$: Subject<IMouseClaim>;
    private _mouseOwner$: Observable<string>;

    constructor(canvasContainer: HTMLElement, container: HTMLElement) {
        this._canvasContainer = canvasContainer;
        this._container = container;

        this._activeSubject$ = new BehaviorSubject<boolean>(false);

        this._active$ = this._activeSubject$
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();

        this._mouseMoveOperation$ = new Subject<IMouseMoveOperation>();
        this._claimMouse$ = new Subject<IMouseClaim>();

        this._documentMouseDown$ = Observable.fromEvent<MouseEvent>(document, "mousedown")
            .filter(
                (event: MouseEvent): boolean => {
                    return this._insideCanvas(event, this._container);
                })
            .share();

        this._documentMouseMove$ = Observable.fromEvent<MouseEvent>(document, "mousemove");
        this._documentMouseUp$ = Observable.fromEvent<MouseEvent>(document, "mouseup");

        this._documentCanvasMouseMove$ = this._documentMouseMove$
            .filter(
                (event: MouseEvent): boolean => {
                    return this._insideCanvas(event, this._container);
                })
            .share();

        this._mouseDown$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mousedown");
        this._mouseLeave$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mouseleave");
        this._mouseUp$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mouseup");
        this._mouseOut$ = Observable.fromEvent<MouseEvent>(canvasContainer, "mouseout");

        this._click$ = Observable.fromEvent<MouseEvent>(canvasContainer, "click");

        this._contextMenu$ = Observable.fromEvent<MouseEvent>(canvasContainer, "contextmenu");
        this._contextMenu$
            .subscribe(
                (event: MouseEvent): void => {
                    event.preventDefault();
                });

        this._mouseWheel$ = Observable.fromEvent<WheelEvent>(document, "wheel")
            .filter(
                (event: WheelEvent): boolean => {
                    return this._insideCanvas(event, this._container);
                })
            .share();

        this._mouseMove$ = this._mouseMoveOperation$
            .scan(
                (e: MouseEvent, operation: IMouseMoveOperation): MouseEvent => {
                    return operation(e);
                },
                null);

        Observable
            .fromEvent<MouseEvent>(canvasContainer, "mousemove")
            .map(
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
            .merge<MouseEvent>(
                this._documentMouseUp$.filter(
                    (e: MouseEvent): boolean => {
                        return e.button === 0;
                    }))
            .share();

        let leftButtonDown$: Observable<MouseEvent> = this._mouseDown$
            .filter(
                (e: MouseEvent): boolean => {
                    return e.button === 0;
                })
            .share();

        this._mouseDragStart$ = leftButtonDown$
            .mergeMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._documentMouseMove$
                        .takeUntil(dragStop$)
                        .take(1);
                });

        this._mouseDrag$ = leftButtonDown$
            .mergeMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._documentMouseMove$
                        .skip(1)
                        .takeUntil(dragStop$);
                });

        this._mouseDragEnd$ = this._mouseDragStart$
            .mergeMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return dragStop$.first();
                });

        this._documentCanvasMouseDown$ = this._documentMouseDown$
            .filter(
                (e: MouseEvent): boolean => {
                    return this._insideCanvas(e, this._container);
                })
            .share();

        let documentCanvasLeftButtonDown$: Observable<MouseEvent> = this._documentCanvasMouseDown$
            .filter(
                (e: MouseEvent): boolean => {
                    return e.button === 0;
                })
            .share();

        this._documentCanvasMouseDragStart$ = documentCanvasLeftButtonDown$
            .mergeMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._documentCanvasMouseMove$
                        .takeUntil(dragStop$)
                        .take(1);
                });

        this._documentCanvasMouseDrag$ = documentCanvasLeftButtonDown$
            .mergeMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return this._documentCanvasMouseMove$
                        .skip(1)
                        .takeUntil(dragStop$);
                });

        this._documentCanvasMouseDragEnd$ = this._documentCanvasMouseDragStart$
            .mergeMap(
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
            .map((claims: {[key: string]: number}): string => {
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

    public get documentCanvasMouseDown$(): Observable<MouseEvent> {
        return this._documentCanvasMouseDown$;
    }

    public get documentCanvasMouseMove$(): Observable<MouseEvent> {
        return this._documentCanvasMouseMove$;
    }

    public get documentCanvasMouseDragStart$(): Observable<MouseEvent> {
        return this._documentCanvasMouseDragStart$;
    }

    public get documentCanvasMouseDrag$(): Observable<MouseEvent> {
        return this._documentCanvasMouseDrag$;
    }

    public get documentCanvasMouseDragEnd$(): Observable<MouseEvent> {
        return this._documentCanvasMouseDragEnd$;
    }

    public get documentMouseMove$(): Observable<MouseEvent> {
        return this._documentMouseMove$;
    }

    public get documentMouseUp$(): Observable<MouseEvent> {
        return this._documentMouseUp$;
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

    public get mouseUp$(): Observable<MouseEvent> {
        return this._mouseUp$;
    }

    public get click$(): Observable<MouseEvent> {
        return this._click$;
    }

    public get contextMenu$(): Observable<MouseEvent> {
        return this._contextMenu$;
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

    private _insideCanvas(event: MouseEvent, element: HTMLElement): boolean {
        let clientRect: ClientRect = this._container.getBoundingClientRect();

        return event.clientX > clientRect.left &&
            event.clientX < clientRect.right &&
            event.clientY > clientRect.top &&
            event.clientY < clientRect.bottom;
    }
}

export default MouseService;
