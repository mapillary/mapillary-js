import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/bufferCount";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/do";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/first";
import "rxjs/add/operator/map";
import "rxjs/add/operator/pairwise";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/withLatestFrom";

import {ILatLon} from "../API";
import {Node} from "../Graph";
import {
    Camera,
    ILatLonAlt,
    Transform,
} from "../Geo";
import {
    FrameGenerator,
    IStateContext,
    IFrame,
    IRotation,
    StateContext,
    State,
} from "../State";

interface IContextOperation {
    (context: IStateContext): IStateContext;
}

interface IContextAction {
    (context: IStateContext): void;
}

interface IMovingOperation {
    (moving: boolean): boolean;
}

export class StateService {
    private _start$: Subject<void>;

    private _frame$: Subject<number>;

    private _contextOperation$: BehaviorSubject<IContextOperation>;
    private _context$: Observable<IStateContext>;
    private _fps$: Observable<number>;
    private _state$: Observable<State>;

    private _currentState$: Observable<IFrame>;
    private _lastState$: Observable<IFrame>;
    private _currentNode$: Observable<Node>;
    private _currentNodeExternal$: Observable<Node>;
    private _currentCamera$: Observable<Camera>;
    private _currentTransform$: Observable<Transform>;
    private _reference$: Observable<ILatLonAlt>;

    private _movingOperation$: Subject<boolean>;
    private _moving$: Observable<boolean>;

    private _appendNode$: Subject<Node> = new Subject<Node>();

    private _frameGenerator: FrameGenerator;
    private _frameId: number;

    private _fpsSampleRate: number;

    constructor () {
        this._start$ = new Subject<void>();
        this._frame$ = new Subject<number>();
        this._fpsSampleRate = 30;

        this._contextOperation$ = new BehaviorSubject<IContextOperation>(
            (context: IStateContext): IStateContext => {
                return context;
            });

        this._context$ = this._contextOperation$
            .scan<IStateContext>(
                (context: IStateContext, operation: IContextOperation): IStateContext => {
                    return operation(context);
                },
                new StateContext())
            .publishReplay(1)
            .refCount();

        this._state$ = this._context$
            .map<State>(
                (context: IStateContext): State => {
                    return context.state;
                })
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();

        this._fps$ = this._start$
            .switchMap<number>(
                (): Observable<number> => {
                    return this._frame$
                        .bufferCount(1, this._fpsSampleRate)
                        .map<number>(
                            (frameIds: number[]): number => {
                                return new Date().getTime();
                            })
                        .pairwise()
                        .map<number>(
                            (times: [number, number]): number => {
                                return Math.max(20, 1000 * this._fpsSampleRate / (times[1] - times[0]));
                            })
                        .startWith(60);
                })
            .share();

        this._currentState$ = this._frame$
            .withLatestFrom(
                this._fps$,
                this._context$,
                (frameId: number, fps: number, context: IStateContext): [number, number, IStateContext] => {
                    return [frameId, fps, context];
                })
            .filter(
                (fc: [number, number, IStateContext]): boolean => {
                    return fc[2].currentNode != null;
                })
            .do(
                (fc: [number, number, IStateContext]): void => {
                    fc[2].update(fc[1]);
                })
            .map<IFrame>(
                (fc: [number, number, IStateContext]): IFrame => {
                    return { fps: fc[1], id: fc[0], state: fc[2] };
                })
            .share();

        this._lastState$ = this._currentState$
            .publishReplay(1)
            .refCount();

        let nodeChanged$: Observable<IFrame> = this._currentState$
            .distinctUntilChanged(
                undefined,
                (f: IFrame): string => {
                    return f.state.currentNode.key;
                })
            .publishReplay(1)
            .refCount();

        let nodeChangedSubject$: Subject<IFrame> = new Subject<IFrame>();

        nodeChanged$.subscribe(nodeChangedSubject$);

        this._currentNode$ = nodeChangedSubject$
            .map<Node>(
                (f: IFrame): Node => {
                    return f.state.currentNode;
                })
            .publishReplay(1)
            .refCount();

        this._currentCamera$ = nodeChangedSubject$
            .map<Camera>(
                (f: IFrame): Camera => {
                    return f.state.currentCamera;
                })
            .publishReplay(1)
            .refCount();

        this._currentTransform$ = nodeChangedSubject$
            .map<Transform>(
                (f: IFrame): Transform => {
                    return f.state.currentTransform;
                })
            .publishReplay(1)
            .refCount();

        this._reference$ = nodeChangedSubject$
            .map<ILatLonAlt>(
                (f: IFrame): ILatLonAlt => {
                    return f.state.reference;
                })
            .distinctUntilChanged(
                (r1: ILatLon, r2: ILatLon): boolean => {
                    return r1.lat === r2.lat && r1.lon === r2.lon;
                },
                (reference: ILatLonAlt): ILatLon => {
                    return { lat: reference.lat, lon: reference.lon };
                })
            .publishReplay(1)
            .refCount();

        this._currentNodeExternal$ = nodeChanged$
            .map<Node>(
                (f: IFrame): Node => {
                    return f.state.currentNode;
                })
            .publishReplay(1)
            .refCount();

        this._appendNode$
            .map<IContextOperation>(
                (node: Node) => {
                    return (context: IStateContext): IStateContext => {
                        context.append([node]);

                        return context;
                    };
                })
            .subscribe(this._contextOperation$);

        this._movingOperation$ = new Subject<boolean>();

        nodeChanged$
            .map<boolean>(
                (frame: IFrame): boolean => {
                    return true;
                })
            .subscribe(this._movingOperation$);

        this._movingOperation$
            .distinctUntilChanged()
            .filter(
                (moving: boolean): boolean => {
                    return moving;
                })
            .switchMap<boolean>(
                (moving: boolean): Observable<boolean> => {
                    return this._currentState$
                        .filter(
                            (frame: IFrame): boolean => {
                                return frame.state.nodesAhead === 0;
                            })
                        .map<[Camera, number]>(
                            (frame: IFrame): [Camera, number] => {
                                return [frame.state.camera.clone(), frame.state.zoom];
                            })
                        .pairwise()
                        .map<boolean>(
                            (pair: [[Camera, number], [Camera, number]]): boolean => {
                                let c1: Camera = pair[0][0];
                                let c2: Camera = pair[1][0];

                                let z1: number = pair[0][1];
                                let z2: number = pair[1][1];

                                return c1.diff(c2) > 1e-5 || Math.abs(z1 - z2) > 1e-5;
                            })
                        .first(
                            (changed: boolean): boolean => {
                                return !changed;
                            });
                })
            .subscribe(this._movingOperation$);

        this._moving$ = this._movingOperation$
            .distinctUntilChanged()
            .share();

        this._state$.subscribe();
        this._currentNode$.subscribe();
        this._currentCamera$.subscribe();
        this._currentTransform$.subscribe();
        this._reference$.subscribe();
        this._currentNodeExternal$.subscribe();
        this._lastState$.subscribe();

        this._frameId = null;
        this._frameGenerator = new FrameGenerator();
    }

    public get currentState$(): Observable<IFrame> {
        return this._currentState$;
    }

    public get currentNode$(): Observable<Node> {
        return this._currentNode$;
    }

    public get currentNodeExternal$(): Observable<Node> {
        return this._currentNodeExternal$;
    }

    public get currentCamera$(): Observable<Camera> {
        return this._currentCamera$;
    }

    public get currentTransform$(): Observable<Transform> {
        return this._currentTransform$;
    }

    public get state$(): Observable<State> {
        return this._state$;
    }

    public get reference$(): Observable<ILatLonAlt> {
        return this._reference$;
    }

    public get moving$(): Observable<boolean> {
        return this._moving$;
    }

    public get appendNode$(): Subject<Node> {
        return this._appendNode$;
    }

    public traverse(): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.traverse(); });
    }

    public wait(): void {
        this._invokeContextOperation((context: IStateContext) => { context.wait(); });
    }

    public appendNodes(nodes: Node[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.append(nodes); });
    }

    public prependNodes(nodes: Node[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.prepend(nodes); });
    }

    public removeNodes(n: number): void {
        this._invokeContextOperation((context: IStateContext) => { context.remove(n); });
    }

    public clearNodes(): void {
        this._invokeContextOperation((context: IStateContext) => { context.clear(); });
    }

    public cutNodes(): void {
        this._invokeContextOperation((context: IStateContext) => { context.cut(); });
    }

    public setNodes(nodes: Node[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.set(nodes); });
    }

    public rotate(delta: IRotation): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotate(delta); });
    }

    public rotateBasic(basicRotation: number[]): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateBasic(basicRotation); });
    }

    public rotateToBasic(basic: number[]): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateToBasic(basic); });
    }

    public move(delta: number): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.move(delta); });
    }

    public moveTo(position: number): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.moveTo(position); });
    }

    /**
     * Change zoom level while keeping the reference point position approximately static.
     *
     * @parameter {number} delta - Change in zoom level.
     * @parameter {Array<number>} reference - Reference point in basic coordinates.
     */
    public zoomIn(delta: number, reference: number[]): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.zoomIn(delta, reference); });
    }

    public getCenter(): Observable<number[]> {
        return this._lastState$
            .first()
            .map<number[]>(
                (frame: IFrame): number[] => {
                    return (<IStateContext>frame.state).getCenter();
                });
    }

    public getZoom(): Observable<number> {
        return this._lastState$
            .first()
            .map<number>(
                (frame: IFrame): number => {
                    return frame.state.zoom;
                });
    }

    public setCenter(center: number[]): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.setCenter(center); });
    }

    public setZoom(zoom: number): void {
        this._movingOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.setZoom(zoom); });
    }

    public start(): void {
        if (this._frameId == null) {
            this._start$.next(null);
            this._frameId = this._frameGenerator.requestAnimationFrame(this._frame.bind(this));
            this._frame$.next(this._frameId);
        }
    }

    public stop(): void {
        if (this._frameId != null) {
            this._frameGenerator.cancelAnimationFrame(this._frameId);
            this._frameId = null;
        }
    }

    private _invokeContextOperation(action: (context: IStateContext) => void): void {
        this._contextOperation$
            .next(
                (context: IStateContext): IStateContext => {
                    action(context);

                    return context;
                });
    }

    private _frame(time: number): void {
        this._frameId = this._frameGenerator.requestAnimationFrame(this._frame.bind(this));
        this._frame$.next(this._frameId);
    }
}
