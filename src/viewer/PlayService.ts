import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    zip as observableZip,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    publish,
    finalize,
    startWith,
    publishReplay,
    refCount,
    map,
    distinctUntilChanged,
    switchMap,
    retry,
    catchError,
    scan,
    filter,
    withLatestFrom,
    first,
    timeout,
    bufferCount,
    mergeMap,
} from "rxjs/operators";

import {ILatLon} from "../API";
import {EdgeDirection} from "../Edge";
import {
    Graph,
    GraphCalculator,
    GraphMode,
    GraphService,
    IEdgeStatus,
    Node,
    Sequence,
} from "../Graph";
import {
    ICurrentState,
    IFrame,
    StateService,
} from "../State";

export class PlayService {
    public static readonly sequenceSpeed: number = 0.54;

    private _graphService: GraphService;
    private _stateService: StateService;
    private _graphCalculator: GraphCalculator;

    private _nodesAhead: number;
    private _playing: boolean;
    private _speed: number;

    private _direction$: Observable<EdgeDirection>;
    private _directionSubject$: Subject<EdgeDirection>;
    private _playing$: Observable<boolean>;
    private _playingSubject$: Subject<boolean>;
    private _speed$: Observable<number>;
    private _speedSubject$: Subject<number>;

    private _playingSubscription: Subscription;
    private _cacheSubscription: Subscription;
    private _clearSubscription: Subscription;
    private _graphModeSubscription: Subscription;
    private _stopSubscription: Subscription;

    private _bridging$: Observable<Node>;

    constructor(graphService: GraphService, stateService: StateService, graphCalculator?: GraphCalculator) {
        this._graphService = graphService;
        this._stateService = stateService;
        this._graphCalculator = !!graphCalculator ? graphCalculator : new GraphCalculator();

        this._directionSubject$ = new Subject<EdgeDirection>();
        this._direction$ = this._directionSubject$.pipe(
            startWith(EdgeDirection.Next),
            publishReplay(1),
            refCount());

        this._direction$.subscribe();

        this._playing = false;
        this._playingSubject$ = new Subject<boolean>();
        this._playing$ = this._playingSubject$.pipe(
            startWith(this._playing),
            publishReplay(1),
            refCount());

        this._playing$.subscribe();

        this._speed = 0.5;
        this._speedSubject$ = new Subject<number>();
        this._speed$ = this._speedSubject$.pipe(
            startWith(this._speed),
            publishReplay(1),
            refCount());

        this._speed$.subscribe();

        this._nodesAhead = this._mapNodesAhead(this._mapSpeed(this._speed));

        this._bridging$ = null;
    }

    public get playing(): boolean {
        return this._playing;
    }

    public get direction$(): Observable<EdgeDirection> {
        return this._direction$;
    }

    public get playing$(): Observable<boolean> {
        return this._playing$;
    }

    public get speed$(): Observable<number> {
        return this._speed$;
    }

    public play(): void {
        if (this._playing) {
            return;
        }

        this._stateService.cutNodes();
        const stateSpeed: number = this._setSpeed(this._speed);
        this._stateService.setSpeed(stateSpeed);

        this._graphModeSubscription = this._speed$.pipe(
            map(
                (speed: number): GraphMode => {
                    return speed > PlayService.sequenceSpeed ? GraphMode.Sequence : GraphMode.Spatial;
                }),
            distinctUntilChanged())
            .subscribe(
                (mode: GraphMode): void => {
                    this._graphService.setGraphMode(mode);
                });

        this._cacheSubscription = observableCombineLatest(
                this._stateService.currentNode$.pipe(
                    map(
                        (node: Node): [string, string] => {
                            return [node.sequenceKey, node.key];
                        }),
                    distinctUntilChanged(
                        undefined,
                        ([sequenceKey, nodeKey]: [string, string]): string => {
                            return sequenceKey;
                        })),
                this._graphService.graphMode$,
                this._direction$).pipe(
            switchMap(
                ([[sequenceKey, nodeKey], mode, direction]: [[string, string], GraphMode, EdgeDirection]):
                    Observable<[Sequence, EdgeDirection]> => {

                    if (direction !== EdgeDirection.Next && direction !== EdgeDirection.Prev) {
                        return observableOf<[Sequence, EdgeDirection]>([undefined, direction]);
                    }

                    const sequence$: Observable<Sequence> = (mode === GraphMode.Sequence ?
                        this._graphService.cacheSequenceNodes$(sequenceKey, nodeKey) :
                        this._graphService.cacheSequence$(sequenceKey)).pipe(
                            retry(3),
                            catchError(
                                (error: Error): Observable<Sequence> => {
                                    console.error(error);

                                    return observableOf(undefined);
                                }));

                    return observableCombineLatest(
                            sequence$,
                            observableOf(direction));
                }),
            switchMap(
                ([sequence, direction]: [Sequence, EdgeDirection]): Observable<string> => {
                    if (sequence === undefined) {
                        return observableEmpty();
                    }

                    const sequenceKeys: string[] = sequence.keys.slice();
                    if (direction === EdgeDirection.Prev) {
                        sequenceKeys.reverse();
                    }

                    return this._stateService.currentState$.pipe(
                        map(
                            (frame: IFrame): [string, number] => {
                                return [frame.state.trajectory[frame.state.trajectory.length - 1].key, frame.state.nodesAhead];
                            }),
                        scan(
                            (
                                [lastRequestKey, previousRequestKeys]: [string, string[]],
                                [lastTrajectoryKey, nodesAhead]: [string, number]):
                                [string, string[]] => {

                                if (lastRequestKey === undefined) {
                                    lastRequestKey = lastTrajectoryKey;
                                }

                                const lastIndex: number = sequenceKeys.length - 1;
                                if (nodesAhead >= this._nodesAhead || sequenceKeys[lastIndex] === lastRequestKey) {
                                    return [lastRequestKey, []];
                                }

                                const current: number = sequenceKeys.indexOf(lastTrajectoryKey);
                                const start: number = sequenceKeys.indexOf(lastRequestKey) + 1;
                                const end: number = Math.min(lastIndex, current + this._nodesAhead - nodesAhead) + 1;

                                if (end <= start) {
                                    return [lastRequestKey, []];
                                }

                                return [sequenceKeys[end - 1], sequenceKeys.slice(start, end)];
                            },
                            [undefined, []]),
                        mergeMap(
                            ([lastRequestKey, newRequestKeys]: [string, string[]]): Observable<string> => {
                                return observableFrom(newRequestKeys);
                            }));
                }),
            mergeMap(
                (key: string): Observable<Node> => {
                    return this._graphService.cacheNode$(key).pipe(
                        catchError(
                            (): Observable<Node> => {
                                return observableEmpty();
                            }));
                },
                6))
            .subscribe();

        this._playingSubscription = this._stateService.currentState$.pipe(
            filter(
                (frame: IFrame): boolean => {
                    return frame.state.nodesAhead < this._nodesAhead;
                }),
            distinctUntilChanged(
                undefined,
                (frame: IFrame): string => {
                    return frame.state.lastNode.key;
                }),
            map(
                (frame: IFrame): [Node, boolean] => {
                    const lastNode: Node = frame.state.lastNode;
                    const trajectory: Node[] = frame.state.trajectory;
                    let increasingTime: boolean = undefined;

                    for (let i: number = trajectory.length - 2; i >= 0; i--) {
                        const node: Node = trajectory[i];
                        if (node.sequenceKey !== lastNode.sequenceKey) {
                            break;
                        }

                        if (node.capturedAt !== lastNode.capturedAt) {
                            increasingTime = node.capturedAt < lastNode.capturedAt;
                            break;
                        }
                    }

                    return [frame.state.lastNode, increasingTime];
                }),
            withLatestFrom(this._direction$),
            switchMap(
                ([[node, increasingTime], direction]: [[Node, boolean], EdgeDirection]): Observable<Node> => {
                    return observableZip(
                            ([EdgeDirection.Next, EdgeDirection.Prev].indexOf(direction) > -1 ?
                                    node.sequenceEdges$ :
                                    node.spatialEdges$).pipe(
                                first(
                                    (status: IEdgeStatus): boolean => {
                                        return status.cached;
                                    }),
                                timeout(15000)),
                            observableOf<EdgeDirection>(direction)).pipe(
                        map(
                            ([s, d]: [IEdgeStatus, EdgeDirection]): string => {
                                for (let edge of s.edges) {
                                    if (edge.data.direction === d) {
                                        return edge.to;
                                    }
                                }

                                return null;
                            }),
                        switchMap(
                            (key: string): Observable<Node> => {
                                return key != null ?
                                    this._graphService.cacheNode$(key) :
                                    this._bridge$(node, increasingTime).pipe(
                                        filter(
                                            (n: Node): boolean => {
                                                return !!n;
                                            }));
                            }));
                }))
            .subscribe(
                (node: Node): void => {
                    this._stateService.appendNodes([node]);
                },
                (error: Error): void => {
                    console.error(error);
                    this.stop();
                });

        this._clearSubscription = this._stateService.currentNode$.pipe(
            bufferCount(1, 10))
            .subscribe(
                (nodes: Node[]): void => {
                    this._stateService.clearPriorNodes();
                });

        this._setPlaying(true);

        const currentLastNodes$: Observable<Node> = this._stateService.currentState$.pipe(
            map(
                (frame: IFrame): ICurrentState => {
                    return frame.state;
                }),
            distinctUntilChanged(
                ([kc1, kl1]: [string, string], [kc2, kl2]: [string, string]): boolean => {
                    return kc1 === kc2 && kl1 === kl2;
                },
                (state: ICurrentState): [string, string] => {
                    return [state.currentNode.key, state.lastNode.key];
                }),
            filter(
                (state: ICurrentState): boolean => {
                    return state.currentNode.key === state.lastNode.key &&
                        state.currentIndex === state.trajectory.length - 1;
                }),
            map(
                (state: ICurrentState): Node => {
                    return state.currentNode;
                }));

        this._stopSubscription = observableCombineLatest(
                currentLastNodes$,
                this._direction$).pipe(
            switchMap(
                ([node, direction]: [Node, EdgeDirection]): Observable<boolean> => {
                    const edgeStatus$: Observable<IEdgeStatus> = (
                        [EdgeDirection.Next, EdgeDirection.Prev].indexOf(direction) > -1 ?
                            node.sequenceEdges$ :
                            node.spatialEdges$).pipe(
                        first(
                            (status: IEdgeStatus): boolean => {
                                return status.cached;
                            }),
                        timeout(15000),
                        catchError(
                            (error: Error): Observable<IEdgeStatus> => {
                                console.error(error);

                                return observableOf<IEdgeStatus>({ cached: false, edges: [] });
                            }));

                    return observableCombineLatest(
                            observableOf(direction),
                            edgeStatus$).pipe(
                        map(
                            ([d, es]: [EdgeDirection, IEdgeStatus]): boolean => {
                                for (const edge of es.edges) {
                                    if (edge.data.direction === d) {
                                        return true;
                                    }
                                }

                                return false;
                            }));
                }),
            mergeMap(
                (hasEdge: boolean): Observable<boolean> => {
                    if (hasEdge || !this._bridging$) {
                        return observableOf(hasEdge);
                    }

                    return this._bridging$.pipe(
                        map(
                            (node: Node): boolean => {
                                return node != null;
                            }),
                        catchError(
                            (error: Error): Observable<boolean> => {
                                console.error(error);

                                return observableOf<boolean>(false);
                            }));
                }),
            first(
                (hasEdge: boolean): boolean => {
                    return !hasEdge;
                }))
            .subscribe(
                undefined,
                undefined,
                (): void => { this.stop(); });

        if (this._stopSubscription.closed) {
            this._stopSubscription = null;
        }
    }

    public setDirection(direction: EdgeDirection): void {
        this._directionSubject$.next(direction);
    }

    public setSpeed(speed: number): void {
        speed = Math.max(0, Math.min(1, speed));
        if (speed === this._speed) {
            return;
        }

        const stateSpeed: number = this._setSpeed(speed);

        if (this._playing) {
            this._stateService.setSpeed(stateSpeed);
        }

        this._speedSubject$.next(this._speed);
    }

    public stop(): void {
        if (!this._playing) {
            return;
        }

        if (!!this._stopSubscription) {
            if (!this._stopSubscription.closed) {
                this._stopSubscription.unsubscribe();
            }

            this._stopSubscription = null;
        }

        this._graphModeSubscription.unsubscribe();
        this._graphModeSubscription = null;

        this._cacheSubscription.unsubscribe();
        this._cacheSubscription = null;

        this._playingSubscription.unsubscribe();
        this._playingSubscription = null;

        this._clearSubscription.unsubscribe();
        this._clearSubscription = null;

        this._stateService.setSpeed(1);
        this._stateService.cutNodes();
        this._graphService.setGraphMode(GraphMode.Spatial);

        this._setPlaying(false);
    }

    private _bridge$(node: Node, increasingTime: boolean): Observable<Node> {
        if (increasingTime === undefined) {
            return observableOf(null);
        }

        const boundingBox: ILatLon[] = this._graphCalculator.boundingBoxCorners(node.latLon, 25);

        this._bridging$ = this._graphService.cacheBoundingBox$(boundingBox[0], boundingBox[1]).pipe(
            mergeMap(
                (nodes: Node[]): Observable<Node> => {
                    let nextNode: Node = null;
                    for (const n of nodes) {
                        if (n.sequenceKey === node.sequenceKey ||
                            !n.cameraUuid ||
                            n.cameraUuid !== node.cameraUuid ||
                            n.capturedAt === node.capturedAt ||
                            n.capturedAt > node.capturedAt !== increasingTime) {
                            continue;
                        }

                        const delta: number = Math.abs(n.capturedAt - node.capturedAt);

                        if (delta > 15000) {
                            continue;
                        }

                        if (!nextNode || delta < Math.abs(nextNode.capturedAt - node.capturedAt)) {
                            nextNode = n;
                        }
                    }

                    return !!nextNode ?
                        this._graphService.cacheNode$(nextNode.key) :
                        observableOf(null);
                }),
            finalize(
                (): void => {
                    this._bridging$ = null;
                }),
            publish(),
            refCount());

        return this._bridging$;
    }

    private _mapSpeed(speed: number): number {
        const x: number = 2 * speed - 1;

        return Math.pow(10, x) - 0.2 * x;
    }

    private _mapNodesAhead(stateSpeed: number): number {
        return Math.round(Math.max(10, Math.min(50, 8 + 6 * stateSpeed)));
    }

    private _setPlaying(playing: boolean): void {
        this._playing = playing;
        this._playingSubject$.next(playing);
    }

    private _setSpeed(speed: number): number {
        this._speed = speed;
        const stateSpeed: number = this._mapSpeed(this._speed);
        this._nodesAhead = this._mapNodesAhead(stateSpeed);

        return stateSpeed;
    }
}

export default PlayService;
