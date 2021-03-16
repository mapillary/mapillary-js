import {
    empty as observableEmpty,
    from as observableFrom,
    Observable,
} from "rxjs";

import {
    bufferCount,
    catchError,
    distinctUntilChanged,
    first,
    map,
    mergeMap,
    skip,
    switchMap,
    timeout,
    withLatestFrom,
} from "rxjs/operators";

import { GraphMode } from "../graph/GraphMode";
import { GraphService } from "../graph/GraphService";
import { Node } from "../graph/Node";
import { NavigationEdgeStatus } from "../graph/interfaces/NavigationEdgeStatus";
import { StateService } from "../state/StateService";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { SubscriptionHolder } from "../utils/SubscriptionHolder";

export class CacheService {
    private _graphService: GraphService;
    private _stateService: StateService;

    private _subscriptions: SubscriptionHolder;
    private _started: boolean;

    constructor(graphService: GraphService, stateService: StateService) {
        this._graphService = graphService;
        this._stateService = stateService;

        this._subscriptions = new SubscriptionHolder()
        this._started = false;
    }

    public get started(): boolean {
        return this._started;
    }

    public start(): void {
        if (this._started) { return; }

        const subs = this._subscriptions;

        subs.push(this._stateService.currentState$.pipe(
            distinctUntilChanged(
                undefined,
                (frame: AnimationFrame): string => {
                    return frame.state.currentNode.key;
                }),
            map(
                (frame: AnimationFrame): [string[], string] => {
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
            .subscribe(() => { /*noop*/ }));

        subs.push(this._graphService.graphMode$.pipe(
            skip(1),
            withLatestFrom(this._stateService.currentState$),
            switchMap(
                ([mode, frame]: [GraphMode, AnimationFrame]): Observable<NavigationEdgeStatus> => {
                    return mode === GraphMode.Sequence ?
                        this._keyToEdges(
                            frame.state.currentNode.key,
                            (node: Node): Observable<NavigationEdgeStatus> => {
                                return node.sequenceEdges$;
                            }) :
                        observableFrom(frame.state.trajectory
                            .map(
                                (node: Node): string => {
                                    return node.key;
                                })
                            .slice(frame.state.currentIndex)).pipe(
                                mergeMap(
                                    (key: string): Observable<NavigationEdgeStatus> => {
                                        return this._keyToEdges(
                                            key,
                                            (node: Node): Observable<NavigationEdgeStatus> => {
                                                return node.spatialEdges$;
                                            });
                                    },
                                    6));
                }))
            .subscribe(() => { /*noop*/ }));

        subs.push(this._graphService.dataAdded$.pipe(
            withLatestFrom(this._stateService.currentKey$),
            switchMap(
                ([_, imageKey]: [string, string]): Observable<Node> => {
                    return this._graphService.cacheNode$(imageKey)
                }))
            .subscribe(() => { /*noop*/ }))

        this._started = true;
    }

    public stop(): void {
        if (!this._started) { return; }

        this._subscriptions.unsubscribe();
        this._started = false;
    }

    private _keyToEdges(key: string, nodeToEdgeMap: (node: Node) => Observable<NavigationEdgeStatus>): Observable<NavigationEdgeStatus> {
        return this._graphService.cacheNode$(key).pipe(
            switchMap(nodeToEdgeMap),
            first(
                (status: NavigationEdgeStatus): boolean => {
                    return status.cached;
                }),
            timeout(15000),
            catchError(
                (error: Error): Observable<NavigationEdgeStatus> => {
                    console.error(`Failed to cache edges (${key}).`, error);

                    return observableEmpty();
                }));
    }
}
