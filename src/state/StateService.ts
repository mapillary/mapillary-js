import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/do";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/pairwise";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/withLatestFrom";

import {Node} from "../Graph";
import {
    ILatLon,
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

export class StateService {
    private _start$: Subject<void>;

    private _frame$: Subject<number>;

    private _contextOperation$: BehaviorSubject<IContextOperation>;
    private _context$: Observable<IStateContext>;
    private _fps$: Observable<number>;
    private _state$: Observable<State>;

    private _currentState$: Observable<IFrame>;
    private _currentNode$: Observable<Node>;
    private _currentNodeExternal$: Observable<Node>;
    private _currentTransform$: Observable<Transform>;
    private _reference$: Observable<ILatLonAlt>;

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
                        .filter(
                            (frameId: number): boolean => {
                                return frameId % this._fpsSampleRate === 0;
                            })
                        .map<number>(
                            (frameId: number): number => {
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

        this._state$.subscribe();
        this._currentNode$.subscribe();
        this._currentTransform$.subscribe();
        this._reference$.subscribe();
        this._currentNodeExternal$.subscribe();

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

    public get currentTransform$(): Observable<Transform> {
        return this._currentTransform$;
    }

    public get state$(): Observable<State> {
        return this._state$;
    }

    public get reference$(): Observable<ILatLonAlt> {
        return this._reference$;
    }

    public get appendNode$(): Subject<Node> {
        return this._appendNode$;
    }

    public traverse(): void {
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

    public cutNodes(): void {
        this._invokeContextOperation((context: IStateContext) => { context.cut(); });
    }

    public setNodes(nodes: Node[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.set(nodes); });
    }

    public rotate(delta: IRotation): void {
        this._invokeContextOperation((context: IStateContext) => { context.rotate(delta); });
    }

    public move(delta: number): void {
        this._invokeContextOperation((context: IStateContext) => { context.move(delta); });
    }

    public moveTo(position: number): void {
        this._invokeContextOperation((context: IStateContext) => { context.moveTo(position); });
    }

    /**
     * Change zoom level while keeping the reference point position approximately static.
     *
     * @parameter {number} delta - Change in zoom level.
     * @parameter {Array<number>} reference - Reference point in basic coordinates.
     */
    public zoomIn(delta: number, reference: number[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.zoomIn(delta, reference); });
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
