import {
    empty as observableEmpty,
    from as observableFrom,
    Observable,
    Subscription,
} from "rxjs";

import {
    catchError,
    timeout,
    first,
    distinctUntilChanged,
    map,
    bufferCount,
    withLatestFrom,
    switchMap,
    skip,
    mergeMap,
} from "rxjs/operators";

import {
    GraphMode,
    GraphService,
    IEdgeStatus,
    Node,
} from "../Graph";
import {
    IFrame,
    StateService,
} from "../State";

export class CacheService {
    private _graphService: GraphService;
    private _stateService: StateService;

    private _started: boolean;

    private _uncacheSubscription: Subscription;
    private _cacheNodeSubscription: Subscription;

    constructor(graphService: GraphService, stateService: StateService) {
        this._graphService = graphService;
        this._stateService = stateService;

        this._started = false;
    }

    public get started(): boolean {
        return this._started;
    }

    public start(): void {
        if (this._started) {
            return;
        }

        this._uncacheSubscription = this._stateService.currentState$.pipe(
            distinctUntilChanged(
                undefined,
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                }),
            map(
                (frame: IFrame): [string[], string] => {
                    const trajectory: Node[] = frame.state.trajectory;
                    const trajectoryKeys: string[] = trajectory
                        .map(
                            (n: Node): string => {
                                return n.key;
                            });

                    const sequenceKey: string = trajectory[trajectory.length - 1].sequenceKey;

                    return [trajectoryKeys, sequenceKey];
                }),
            bufferCount(1, 5),
            withLatestFrom(this._graphService.graphMode$),
            switchMap(
                ([keepBuffer, graphMode]: [[string[], string][], GraphMode]): Observable<void> => {
                    let keepKeys: string[] = keepBuffer[0][0];
                    let keepSequenceKey: string = graphMode === GraphMode.Sequence ?
                        keepBuffer[0][1] : undefined;

                    return this._graphService.uncache$(keepKeys, keepSequenceKey);
                }))
            .subscribe(() => { /*noop*/ });

        this._cacheNodeSubscription = this._graphService.graphMode$.pipe(
            skip(1),
            withLatestFrom(this._stateService.currentState$),
            switchMap(
                ([mode, frame]: [GraphMode, IFrame]): Observable<IEdgeStatus> => {
                    return mode === GraphMode.Sequence ?
                        this._keyToEdges(
                            frame.state.currentNode.key,
                            (node: Node): Observable<IEdgeStatus> => {
                                return node.sequenceEdges$;
                            }) :
                        observableFrom(frame.state.trajectory
                                .map(
                                    (node: Node): string => {
                                        return node.key;
                                    })
                                .slice(frame.state.currentIndex)).pipe(
                            mergeMap(
                                (key: string): Observable<IEdgeStatus> => {
                                    return this._keyToEdges(
                                        key,
                                        (node: Node): Observable<IEdgeStatus> => {
                                            return node.spatialEdges$;
                                        });
                                },
                                6));
                }))
            .subscribe(() => { /*noop*/ });

        this._started = true;
    }

    public stop(): void {
        if (!this._started) {
            return;
        }

        this._uncacheSubscription.unsubscribe();
        this._uncacheSubscription = null;

        this._cacheNodeSubscription.unsubscribe();
        this._cacheNodeSubscription = null;

        this._started = false;
    }

    private _keyToEdges(key: string, nodeToEdgeMap: (node: Node) => Observable<IEdgeStatus>): Observable<IEdgeStatus> {
        return this._graphService.cacheNode$(key).pipe(
            switchMap(nodeToEdgeMap),
            first(
                (status: IEdgeStatus): boolean => {
                    return status.cached;
                }),
            timeout(15000),
            catchError(
                (error: Error): Observable<IEdgeStatus> => {
                    console.error(`Failed to cache edges (${key}).`, error);

                    return observableEmpty();
                }));
    }
}

export default CacheService;
