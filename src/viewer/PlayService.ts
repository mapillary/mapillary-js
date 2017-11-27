import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import {EdgeDirection} from "../Edge";
import {
    Graph,
    GraphMode,
    GraphService,
    IEdgeStatus,
    Node,
    Sequence,
} from "../Graph";
import {
    IFrame,
    StateService,
} from "../State";

export class PlayService {
    private _graphService: GraphService;
    private _stateService: StateService;

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

    constructor(graphService: GraphService, stateService: StateService) {
        this._graphService = graphService;
        this._stateService = stateService;

        this._directionSubject$ = new Subject<EdgeDirection>();
        this._direction$ = this._directionSubject$
            .startWith(EdgeDirection.Next)
            .publishReplay(1)
            .refCount();

        this._direction$.subscribe();

        this._playing = false;
        this._playingSubject$ = new Subject<boolean>();
        this._playing$ = this._playingSubject$
            .startWith(this._playing)
            .publishReplay(1)
            .refCount();

        this._speed = 0.5;
        this._speedSubject$ = new Subject<number>();
        this._speed$ = this._speedSubject$
            .startWith(this._speed)
            .publishReplay(1)
            .refCount();

        this._speed$.subscribe();

        this._nodesAhead = this._mapNodesAhead(this._mapSpeed(this._speed));

        this._playing$
            .switchMap(
                (playing: boolean): Observable<[EdgeDirection, IEdgeStatus]> => {
                    return !playing ?
                        Observable.empty() :
                        Observable
                            .combineLatest(
                                this._direction$,
                                this._stateService.currentNode$
                            .switchMap(
                                (node: Node): Observable<IEdgeStatus> => {
                                    return node.sequenceEdges$;
                                }));
                })
            .map(
                ([direction, edgeStatus]: [EdgeDirection, IEdgeStatus]): boolean => {
                    if (!edgeStatus.cached) {
                        return true;
                    }

                    for (let edge of edgeStatus.edges) {
                        if (edge.data.direction === direction) {
                            return true;
                        }
                    }

                    return false;
                })
            .filter(
                (hasEdge: boolean): boolean => {
                    return !hasEdge;
                })
            .subscribe((): void => { this.stop(); });
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

    public play(): void {
        if (this._playing) {
            return;
        }

        this._stateService.cutNodes();
        this._setSpeed(this._speed);

        this._cacheSubscription = this._stateService.currentNode$
            .map(
                (node: Node): string => {
                    return node.sequenceKey;
                })
            .distinctUntilChanged()
            .switchMap(
                (sequenceKey: string): Observable<Sequence> => {
                    return this._graphService.cacheSequence$(sequenceKey)
                        .retry(3)
                        .catch(
                            (): Observable<Sequence> => {
                                return Observable.of(undefined);
                            });
                })
            .switchMap(
                (sequence: Sequence): Observable<string> => {
                    if (sequence === undefined) {
                        return Observable.empty();
                    }

                    const sequenceKeys: string[] = sequence.keys.slice();

                    return this._stateService.currentState$
                        .map(
                            (frame: IFrame): [string, number] => {
                                return [frame.state.trajectory[frame.state.trajectory.length - 1].key, frame.state.nodesAhead];
                            })
                        .scan(
                            (
                                [lastRequestKey, previousRequestKeys]: [string, string[]],
                                [lastTrajectoryKey, nodesAhead]: [string, number]):
                                [string, string[]] => {

                                if (lastRequestKey === undefined) {
                                    lastRequestKey = lastTrajectoryKey;
                                }

                                if (nodesAhead >= this._nodesAhead || sequenceKeys.indexOf(lastRequestKey) === sequenceKeys.length - 1) {
                                    return [lastRequestKey, []];
                                }

                                const current: number = sequenceKeys.indexOf(lastTrajectoryKey);
                                const start: number = sequenceKeys.indexOf(lastRequestKey);
                                const end: number = start + (this._nodesAhead - nodesAhead) - (start - current);

                                if (end === start) {
                                    return [lastRequestKey, []];
                                }

                                return [sequenceKeys[end], sequenceKeys.slice(start, end)];
                            },
                            [undefined, []])
                        .mergeMap(
                            ([lastRequestKey, newRequestKeys]: [string, string[]]): Observable<string> => {
                                return Observable.from(newRequestKeys);
                            });
                })
            .mergeMap(
                (key: string): Observable<Node> => {
                    return this._graphService.cacheNode$(key)
                        .catch(
                            (): Observable<Node> => {
                                return Observable.empty();
                            });
                },
                6)
            .subscribe();

        this._playingSubscription = this._stateService.currentState$
            .filter(
                (frame: IFrame): boolean => {
                    return frame.state.nodesAhead < this._nodesAhead;
                })
            .map(
                (frame: IFrame): Node => {
                    return frame.state.lastNode;
                })
            .distinctUntilChanged(
                undefined,
                (lastNode: Node): string => {
                    return lastNode.key;
                })
            .withLatestFrom(this._direction$)
            .switchMap(
                ([node, direction]: [Node, EdgeDirection]): Observable<[IEdgeStatus, EdgeDirection]> => {
                    return ([EdgeDirection.Next, EdgeDirection.Prev].indexOf(direction) > -1 ?
                            node.sequenceEdges$ :
                            node.spatialEdges$)
                        .filter(
                            (status: IEdgeStatus): boolean => {
                                return status.cached;
                            })
                        .zip(
                            Observable.of<EdgeDirection>(direction),
                            (s: IEdgeStatus, d: EdgeDirection): [IEdgeStatus, EdgeDirection] => {
                                return [s, d];
                            });
                })
            .map(
                (ed: [IEdgeStatus, EdgeDirection]): string => {
                    let direction: EdgeDirection = ed[1];

                    for (let edge of ed[0].edges) {
                        if (edge.data.direction === direction) {
                            return edge.to;
                        }
                    }

                    return null;
                })
            .filter(
                (key: string): boolean => {
                    return key != null;
                })
            .switchMap(
                (key: string): Observable<Node> => {
                    return this._graphService.cacheNode$(key);
                })
            .subscribe(
                (node: Node): void => {
                    this._stateService.appendNodes([node]);
                },
                (error: Error): void => {
                    console.error(error);
                    this.stop();
                });

        this._clearSubscription = this._stateService.currentNode$
            .bufferCount(1, 10)
            .subscribe(
                (nodes: Node[]): void => {
                    this._stateService.clearPriorNodes();
                });

        this._playing = true;
        this._playingSubject$.next(this._playing);
    }

    public setSpeed(speed: number): void {
        this._setSpeed(speed);
        this._speedSubject$.next(this._speed);
    }

    public stop(): void {
        if (!this._playing) {
            return;
        }

        this._stateService.setSpeed(1);
        this._stateService.cutNodes();

        this._cacheSubscription.unsubscribe();
        this._cacheSubscription = null;

        this._playingSubscription.unsubscribe();
        this._playingSubscription = null;

        this._clearSubscription.unsubscribe();
        this._clearSubscription = null;

        this._playing = false;
        this._playingSubject$.next(this._playing);
    }

    private _mapSpeed(speed: number): number {
        const x: number = 2 * speed - 1;

        return Math.pow(10, x) - 0.2 * x;
    }

    private _mapNodesAhead(stateSpeed: number): number {
        return Math.round(Math.max(10, Math.min(50, 8 + 6 * stateSpeed)));
    }

    private _setSpeed(speed: number): void {
        this._speed = Math.max(0, Math.min(1, speed));
        const stateSpeed: number = this._mapSpeed(this._speed);
        this._nodesAhead = this._mapNodesAhead(stateSpeed);
        this._stateService.setSpeed(stateSpeed);
    }
}

export default PlayService;
