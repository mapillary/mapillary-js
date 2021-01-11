import {
    BehaviorSubject,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    first,
    tap,
    filter,
    withLatestFrom,
    startWith,
    pairwise,
    distinctUntilChanged,
    publishReplay,
    refCount,
    bufferCount,
    share,
    switchMap,
    map,
    scan,
} from "rxjs/operators";

import { ILatLon } from "../API";
import { Node } from "../Graph";
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
    TransitionMode,
} from "../State";
import SubscriptionHolder from "../utils/SubscriptionHolder";

interface IContextOperation {
    (context: IStateContext): IStateContext;
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
    private _currentKey$: BehaviorSubject<string>;
    private _currentTransform$: Observable<Transform>;
    private _reference$: Observable<ILatLonAlt>;

    private _inMotionOperation$: Subject<boolean>;
    private _inMotion$: Observable<boolean>;

    private _inTranslationOperation$: Subject<boolean>;
    private _inTranslation$: Observable<boolean>;

    private _appendNode$: Subject<Node> = new Subject<Node>();

    private _frameGenerator: FrameGenerator;
    private _frameId: number;

    private _fpsSampleRate: number;

    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    constructor(transitionMode?: TransitionMode) {
        const subs = this._subscriptions;

        this._start$ = new Subject<void>();
        this._frame$ = new Subject<number>();
        this._fpsSampleRate = 30;

        this._contextOperation$ = new BehaviorSubject<IContextOperation>(
            (context: IStateContext): IStateContext => {
                return context;
            });

        this._context$ = this._contextOperation$.pipe(
            scan(
                (context: IStateContext, operation: IContextOperation): IStateContext => {
                    return operation(context);
                },
                new StateContext(transitionMode)),
            publishReplay(1),
            refCount());

        this._state$ = this._context$.pipe(
            map(
                (context: IStateContext): State => {
                    return context.state;
                }),
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        this._fps$ = this._start$.pipe(
            switchMap(
                (): Observable<number> => {
                    return this._frame$.pipe(
                        bufferCount(1, this._fpsSampleRate),
                        map(
                            (frameIds: number[]): number => {
                                return new Date().getTime();
                            }),
                        pairwise(),
                        map(
                            (times: [number, number]): number => {
                                return Math.max(20, 1000 * this._fpsSampleRate / (times[1] - times[0]));
                            }),
                        startWith(60));
                }),
            share());

        this._currentState$ = this._frame$.pipe(
            withLatestFrom(
                this._fps$,
                this._context$,
                (frameId: number, fps: number, context: IStateContext): [number, number, IStateContext] => {
                    return [frameId, fps, context];
                }),
            filter(
                (fc: [number, number, IStateContext]): boolean => {
                    return fc[2].currentNode != null;
                }),
            tap(
                (fc: [number, number, IStateContext]): void => {
                    fc[2].update(fc[1]);
                }),
            map(
                (fc: [number, number, IStateContext]): IFrame => {
                    return { fps: fc[1], id: fc[0], state: fc[2] };
                }),
            share());

        this._lastState$ = this._currentState$.pipe(
            publishReplay(1),
            refCount());

        let nodeChanged$: Observable<IFrame> = this._currentState$.pipe(
            distinctUntilChanged(
                undefined,
                (f: IFrame): string => {
                    return f.state.currentNode.key;
                }),
            publishReplay(1),
            refCount());

        let nodeChangedSubject$: Subject<IFrame> = new Subject<IFrame>();

        subs.push(nodeChanged$
            .subscribe(nodeChangedSubject$));

        this._currentKey$ = new BehaviorSubject<string>(null);

        subs.push(nodeChangedSubject$.pipe(
            map(
                (f: IFrame): string => {
                    return f.state.currentNode.key;
                }))
            .subscribe(this._currentKey$));

        this._currentNode$ = nodeChangedSubject$.pipe(
            map(
                (f: IFrame): Node => {
                    return f.state.currentNode;
                }),
            publishReplay(1),
            refCount());

        this._currentCamera$ = nodeChangedSubject$.pipe(
            map(
                (f: IFrame): Camera => {
                    return f.state.currentCamera;
                }),
            publishReplay(1),
            refCount());

        this._currentTransform$ = nodeChangedSubject$.pipe(
            map(
                (f: IFrame): Transform => {
                    return f.state.currentTransform;
                }),
            publishReplay(1),
            refCount());

        this._reference$ = nodeChangedSubject$.pipe(
            map(
                (f: IFrame): ILatLonAlt => {
                    return f.state.reference;
                }),
            distinctUntilChanged(
                (r1: ILatLon, r2: ILatLon): boolean => {
                    return r1.lat === r2.lat && r1.lon === r2.lon;
                },
                (reference: ILatLonAlt): ILatLon => {
                    return { lat: reference.lat, lon: reference.lon };
                }),
            publishReplay(1),
            refCount());

        this._currentNodeExternal$ = nodeChanged$.pipe(
            map(
                (f: IFrame): Node => {
                    return f.state.currentNode;
                }),
            publishReplay(1),
            refCount());

        subs.push(this._appendNode$.pipe(
            map(
                (node: Node) => {
                    return (context: IStateContext): IStateContext => {
                        context.append([node]);

                        return context;
                    };
                }))
            .subscribe(this._contextOperation$));

        this._inMotionOperation$ = new Subject<boolean>();

        subs.push(nodeChanged$.pipe(
            map(
                (frame: IFrame): boolean => {
                    return true;
                }))
            .subscribe(this._inMotionOperation$));

        subs.push(this._inMotionOperation$.pipe(
            distinctUntilChanged(),
            filter(
                (moving: boolean): boolean => {
                    return moving;
                }),
            switchMap(
                (moving: boolean): Observable<boolean> => {
                    return this._currentState$.pipe(
                        filter(
                            (frame: IFrame): boolean => {
                                return frame.state.nodesAhead === 0;
                            }),
                        map(
                            (frame: IFrame): [Camera, number] => {
                                return [frame.state.camera.clone(), frame.state.zoom];
                            }),
                        pairwise(),
                        map(
                            (pair: [[Camera, number], [Camera, number]]): boolean => {
                                let c1: Camera = pair[0][0];
                                let c2: Camera = pair[1][0];

                                let z1: number = pair[0][1];
                                let z2: number = pair[1][1];

                                return c1.diff(c2) > 1e-5 || Math.abs(z1 - z2) > 1e-5;
                            }),
                        first(
                            (changed: boolean): boolean => {
                                return !changed;
                            }));
                }))
            .subscribe(this._inMotionOperation$));

        this._inMotion$ = this._inMotionOperation$.pipe(
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        this._inTranslationOperation$ = new Subject<boolean>();

        subs.push(nodeChanged$.pipe(
            map(
                (frame: IFrame): boolean => {
                    return true;
                }))
            .subscribe(this._inTranslationOperation$));

        subs.push(this._inTranslationOperation$.pipe(
            distinctUntilChanged(),
            filter(
                (inTranslation: boolean): boolean => {
                    return inTranslation;
                }),
            switchMap(
                (inTranslation: boolean): Observable<boolean> => {
                    return this._currentState$.pipe(
                        filter(
                            (frame: IFrame): boolean => {
                                return frame.state.nodesAhead === 0;
                            }),
                        map(
                            (frame: IFrame): THREE.Vector3 => {
                                return frame.state.camera.position.clone();
                            }),
                        pairwise(),
                        map(
                            (pair: [THREE.Vector3, THREE.Vector3]): boolean => {
                                return pair[0].distanceToSquared(pair[1]) !== 0;
                            }),
                        first(
                            (changed: boolean): boolean => {
                                return !changed;
                            }));
                }))
            .subscribe(this._inTranslationOperation$));

        this._inTranslation$ = this._inTranslationOperation$.pipe(
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        subs.push(this._state$.subscribe(() => { /*noop*/ }));
        subs.push(this._currentNode$.subscribe(() => { /*noop*/ }));
        subs.push(this._currentCamera$.subscribe(() => { /*noop*/ }));
        subs.push(this._currentTransform$.subscribe(() => { /*noop*/ }));
        subs.push(this._reference$.subscribe(() => { /*noop*/ }));
        subs.push(this._currentNodeExternal$.subscribe(() => { /*noop*/ }));
        subs.push(this._lastState$.subscribe(() => { /*noop*/ }));
        subs.push(this._inMotion$.subscribe(() => { /*noop*/ }));
        subs.push(this._inTranslation$.subscribe(() => { /*noop*/ }));

        this._frameId = null;
        this._frameGenerator = new FrameGenerator(window);
    }

    public get currentState$(): Observable<IFrame> {
        return this._currentState$;
    }

    public get currentNode$(): Observable<Node> {
        return this._currentNode$;
    }

    public get currentKey$(): Observable<string> {
        return this._currentKey$;
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

    public get inMotion$(): Observable<boolean> {
        return this._inMotion$;
    }

    public get inTranslation$(): Observable<boolean> {
        return this._inTranslation$;
    }

    public get appendNode$(): Subject<Node> {
        return this._appendNode$;
    }

    public dispose(): void {
        this.stop();
        this._subscriptions.unsubscribe();
    }

    public earth(): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.earth(); });
    }

    public traverse(): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.traverse(); });
    }

    public wait(): void {
        this._invokeContextOperation((context: IStateContext) => { context.wait(); });
    }

    public waitInteractively(): void {
        this._invokeContextOperation((context: IStateContext) => { context.waitInteractively(); });
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

    public clearPriorNodes(): void {
        this._invokeContextOperation((context: IStateContext) => { context.clearPrior(); });
    }

    public cutNodes(): void {
        this._invokeContextOperation((context: IStateContext) => { context.cut(); });
    }

    public setNodes(nodes: Node[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.set(nodes); });
    }

    public rotate(delta: IRotation): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotate(delta); });
    }

    public rotateUnbounded(delta: IRotation): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateUnbounded(delta); });
    }

    public rotateWithoutInertia(delta: IRotation): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateWithoutInertia(delta); });
    }

    public rotateBasic(basicRotation: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateBasic(basicRotation); });
    }

    public rotateBasicUnbounded(basicRotation: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateBasicUnbounded(basicRotation); });
    }

    public rotateBasicWithoutInertia(basicRotation: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateBasicWithoutInertia(basicRotation); });
    }

    public rotateToBasic(basic: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateToBasic(basic); });
    }

    public move(delta: number): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.move(delta); });
    }

    public moveTo(position: number): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.moveTo(position); });
    }

    public dolly(delta: number): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.dolly(delta); });
    }

    public orbit(rotation: IRotation): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.orbit(rotation); });
    }

    public truck(direction: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.truck(direction); });
    }

    /**
     * Change zoom level while keeping the reference point position approximately static.
     *
     * @parameter {number} delta - Change in zoom level.
     * @parameter {Array<number>} reference - Reference point in basic coordinates.
     */
    public zoomIn(delta: number, reference: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.zoomIn(delta, reference); });
    }

    public getCenter(): Observable<number[]> {
        return this._lastState$.pipe(
            first(),
            map(
                (frame: IFrame): number[] => {
                    return (<IStateContext>frame.state).getCenter();
                }));
    }

    public getZoom(): Observable<number> {
        return this._lastState$.pipe(
            first(),
            map(
                (frame: IFrame): number => {
                    return frame.state.zoom;
                }));
    }

    public setCenter(center: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.setCenter(center); });
    }

    public setSpeed(speed: number): void {
        this._invokeContextOperation((context: IStateContext) => { context.setSpeed(speed); });
    }

    public setTransitionMode(mode: TransitionMode): void {
        this._invokeContextOperation((context: IStateContext) => { context.setTransitionMode(mode); });
    }

    public setZoom(zoom: number): void {
        this._inMotionOperation$.next(true);
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
