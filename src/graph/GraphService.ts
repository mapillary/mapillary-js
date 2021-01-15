import {
    concat as observableConcat,
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    first,
    expand,
    map,
    last,
    mergeMap,
    startWith,
    publishReplay,
    refCount,
    catchError,
    finalize,
    tap,
} from "rxjs/operators";

import { ILatLon } from "../API";
import {
    FilterExpression,
    Graph,
    GraphMode,
    Node,
    Sequence,
} from "../Graph";
import SubscriptionHolder from "../utils/SubscriptionHolder";
import { FilterFunction } from "./FilterCreator";

/**
 * @class GraphService
 *
 * @classdesc Represents a service for graph operations.
 */
export class GraphService {
    private _graph$: Observable<Graph>;
    private _graphMode: GraphMode;
    private _graphMode$: Observable<GraphMode>;
    private _graphModeSubject$: Subject<GraphMode>;

    private _firstGraphSubjects$: Subject<Graph>[];

    private _initializeCacheSubscriptions: Subscription[];
    private _sequenceSubscriptions: Subscription[];
    private _spatialSubscriptions: Subscription[];
    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    /**
     * Create a new graph service instance.
     *
     * @param {Graph} graph - Graph instance to be operated on.
     */
    constructor(graph: Graph) {
        const subs = this._subscriptions;

        this._graph$ = observableConcat(
            observableOf(graph),
            graph.changed$).pipe(
                publishReplay(1),
                refCount());

        subs.push(this._graph$.subscribe(() => { /*noop*/ }));

        this._graphMode = GraphMode.Spatial;
        this._graphModeSubject$ = new Subject<GraphMode>();
        this._graphMode$ = this._graphModeSubject$.pipe(
            startWith(this._graphMode),
            publishReplay(1),
            refCount());

        subs.push(this._graphMode$.subscribe(() => { /*noop*/ }));

        this._firstGraphSubjects$ = [];

        this._initializeCacheSubscriptions = [];
        this._sequenceSubscriptions = [];
        this._spatialSubscriptions = [];
    }

    /**
     * Get filter observable.
     *
     * @desciption Emits the filter every time it has changed.
     *
     * @returns {Observable<FilterFunction>} Observable
     * emitting the filter function every time it is set.
     */
    public get filter$(): Observable<FilterFunction> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<FilterFunction> => {
                    return graph.filter$;
                }));
    }

    /**
     * Get graph mode observable.
     *
     * @description Emits the current graph mode.
     *
     * @returns {Observable<GraphMode>} Observable
     * emitting the current graph mode when it changes.
     */
    public get graphMode$(): Observable<GraphMode> {
        return this._graphMode$;
    }

    /**
     * Cache full nodes in a bounding box.
     *
     * @description When called, the full properties of
     * the node are retrieved. The node cache is not initialized
     * for any new nodes retrieved and the node assets are not
     * retrieved, {@link cacheNode$} needs to be called for caching
     * assets.
     *
     * @param {ILatLon} sw - South west corner of bounding box.
     * @param {ILatLon} ne - North east corner of bounding box.
     * @return {Observable<Array<Node>>} Observable emitting a single item,
     * the nodes of the bounding box, when they have all been retrieved.
     * @throws {Error} Propagates any IO node caching errors to the caller.
     */
    public cacheBoundingBox$(sw: ILatLon, ne: ILatLon): Observable<Node[]> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Node[]> => {
                    return graph.cacheBoundingBox$(sw, ne);
                }));
    }

    /**
     * Cache a node in the graph and retrieve it.
     *
     * @description When called, the full properties of
     * the node are retrieved and the node cache is initialized.
     * After that the node assets are cached and the node
     * is emitted to the observable when.
     * In parallel to caching the node assets, the sequence and
     * spatial edges of the node are cached. For this, the sequence
     * of the node and the required tiles and spatial nodes are
     * retrieved. The sequence and spatial edges may be set before
     * or after the node is returned.
     *
     * @param {string} key - Key of the node to cache.
     * @return {Observable<Node>} Observable emitting a single item,
     * the node, when it has been retrieved and its assets are cached.
     * @throws {Error} Propagates any IO node caching errors to the caller.
     */
    public cacheNode$(key: string): Observable<Node> {
        const firstGraphSubject$: Subject<Graph> = new Subject<Graph>();

        this._firstGraphSubjects$.push(firstGraphSubject$);

        const firstGraph$: Observable<Graph> = firstGraphSubject$.pipe(
            publishReplay(1),
            refCount());

        const node$: Observable<Node> = firstGraph$.pipe(
            map(
                (graph: Graph): Node => {
                    return graph.getNode(key);
                }),
            mergeMap(
                (node: Node): Observable<Node> => {
                    return node.assetsCached ?
                        observableOf(node) :
                        node.cacheAssets$();
                }),
            publishReplay(1),
            refCount());

        node$.subscribe(
            undefined,
            (error: Error): void => {
                console.error(`Failed to cache node (${key})`, error);
            });

        const initializeCacheSubscription: Subscription = this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingFull(key) || !graph.hasNode(key)) {
                        return graph.cacheFull$(key);
                    }

                    if (graph.isCachingFill(key) || !graph.getNode(key).full) {
                        return graph.cacheFill$(key);
                    }

                    return observableOf<Graph>(graph);
                }),
            tap(
                (graph: Graph): void => {
                    if (!graph.hasInitializedCache(key)) {
                        graph.initializeCache(key);
                    }
                }),
            finalize(
                (): void => {
                    if (initializeCacheSubscription == null) {
                        return;
                    }

                    this._removeFromArray(initializeCacheSubscription, this._initializeCacheSubscriptions);
                    this._removeFromArray(firstGraphSubject$, this._firstGraphSubjects$);
                }))
            .subscribe(
                (graph: Graph): void => {
                    firstGraphSubject$.next(graph);
                    firstGraphSubject$.complete();
                },
                (error: Error): void => {
                    firstGraphSubject$.error(error);
                });

        if (!initializeCacheSubscription.closed) {
            this._initializeCacheSubscriptions.push(initializeCacheSubscription);
        }

        const graphSequence$: Observable<Graph> = firstGraph$.pipe(
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingNodeSequence(key) || !graph.hasNodeSequence(key)) {
                        return graph.cacheNodeSequence$(key);
                    }

                    return observableOf<Graph>(graph);
                }),
            publishReplay(1),
            refCount());

        const sequenceSubscription: Subscription = graphSequence$.pipe(
            tap(
                (graph: Graph): void => {
                    if (!graph.getNode(key).sequenceEdges.cached) {
                        graph.cacheSequenceEdges(key);
                    }
                }),
            finalize(
                (): void => {
                    if (sequenceSubscription == null) {
                        return;
                    }

                    this._removeFromArray(sequenceSubscription, this._sequenceSubscriptions);
                }))
            .subscribe(
                (): void => { return; },
                (error: Error): void => {
                    console.error(`Failed to cache sequence edges (${key}).`, error);
                });

        if (!sequenceSubscription.closed) {
            this._sequenceSubscriptions.push(sequenceSubscription);
        }

        if (this._graphMode === GraphMode.Spatial) {
            const spatialSubscription: Subscription = firstGraph$.pipe(
                expand(
                    (graph: Graph): Observable<Graph> => {
                        if (graph.hasTiles(key)) {
                            return observableEmpty();
                        }

                        return observableFrom(graph.cacheTiles$(key)).pipe(
                            mergeMap(
                                (graph$: Observable<Graph>): Observable<Graph> => {
                                    return graph$.pipe(
                                        mergeMap(
                                            (g: Graph): Observable<Graph> => {
                                                if (g.isCachingTiles(key)) {
                                                    return observableEmpty();
                                                }

                                                return observableOf<Graph>(g);
                                            }),
                                        catchError(
                                            (error: Error, caught$: Observable<Graph>): Observable<Graph> => {
                                                console.error(`Failed to cache tile data (${key}).`, error);

                                                return observableEmpty();
                                            }));
                                }));
                    }),
                last(),
                mergeMap(
                    (graph: Graph): Observable<Graph> => {
                        if (graph.hasSpatialArea(key)) {
                            return observableOf<Graph>(graph);
                        }

                        return observableFrom(graph.cacheSpatialArea$(key)).pipe(
                            mergeMap(
                                (graph$: Observable<Graph>): Observable<Graph> => {
                                    return graph$.pipe(
                                        catchError(
                                            (error: Error, caught$: Observable<Graph>): Observable<Graph> => {
                                                console.error(`Failed to cache spatial nodes (${key}).`, error);

                                                return observableEmpty();
                                            }));
                                }));
                    }),
                last(),
                mergeMap(
                    (graph: Graph): Observable<Graph> => {
                        return graph.hasNodeSequence(key) ?
                            observableOf<Graph>(graph) :
                            graph.cacheNodeSequence$(key);
                    }),
                tap(
                    (graph: Graph): void => {
                        if (!graph.getNode(key).spatialEdges.cached) {
                            graph.cacheSpatialEdges(key);
                        }
                    }),
                finalize(
                    (): void => {
                        if (spatialSubscription == null) {
                            return;
                        }

                        this._removeFromArray(spatialSubscription, this._spatialSubscriptions);
                    }))
                .subscribe(
                    (): void => { return; },
                    (error: Error): void => {
                        console.error(`Failed to cache spatial edges (${key}).`, error);
                    });

            if (!spatialSubscription.closed) {
                this._spatialSubscriptions.push(spatialSubscription);
            }
        }

        return node$.pipe(
            first(
                (node: Node): boolean => {
                    return node.assetsCached;
                }));
    }

    /**
     * Cache a sequence in the graph and retrieve it.
     *
     * @param {string} sequenceKey - Sequence key.
     * @returns {Observable<Sequence>} Observable emitting a single item,
     * the sequence, when it has been retrieved and its assets are cached.
     * @throws {Error} Propagates any IO node caching errors to the caller.
     */
    public cacheSequence$(sequenceKey: string): Observable<Sequence> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequence(sequenceKey) || !graph.hasSequence(sequenceKey)) {
                        return graph.cacheSequence$(sequenceKey);
                    }

                    return observableOf<Graph>(graph);
                }),
            map(
                (graph: Graph): Sequence => {
                    return graph.getSequence(sequenceKey);
                }));
    }

    /**
     * Cache a sequence and its nodes in the graph and retrieve the sequence.
     *
     * @description Caches a sequence and its assets are cached and
     * retrieves all nodes belonging to the sequence. The node assets
     * or edges will not be cached.
     *
     * @param {string} sequenceKey - Sequence key.
     * @param {string} referenceNodeKey - Key of node to use as reference
     * for optimized caching.
     * @returns {Observable<Sequence>} Observable emitting a single item,
     * the sequence, when it has been retrieved, its assets are cached and
     * all nodes belonging to the sequence has been retrieved.
     * @throws {Error} Propagates any IO node caching errors to the caller.
     */
    public cacheSequenceNodes$(sequenceKey: string, referenceNodeKey?: string): Observable<Sequence> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequence(sequenceKey) || !graph.hasSequence(sequenceKey)) {
                        return graph.cacheSequence$(sequenceKey);
                    }

                    return observableOf<Graph>(graph);
                }),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequenceNodes(sequenceKey) || !graph.hasSequenceNodes(sequenceKey)) {
                        return graph.cacheSequenceNodes$(sequenceKey, referenceNodeKey);
                    }

                    return observableOf<Graph>(graph);
                }),
            map(
                (graph: Graph): Sequence => {
                    return graph.getSequence(sequenceKey);
                }));
    }

    /**
     * Dispose the graph service and its children.
     */
    public dispose(): void {
        this._graph$
            .pipe(first())
            .subscribe((graph: Graph) => { graph.unsubscribe(); });
        this._subscriptions.unsubscribe();
    }

    /**
     * Set a spatial edge filter on the graph.
     *
     * @description Resets the spatial edges of all cached nodes.
     *
     * @param {FilterExpression} filter - Filter expression to be applied.
     * @return {Observable<Graph>} Observable emitting a single item,
     * the graph, when the spatial edges have been reset.
     */
    public setFilter$(filter: FilterExpression): Observable<void> {
        this._resetSubscriptions(this._spatialSubscriptions);

        return this._graph$.pipe(
            first(),
            tap(
                (graph: Graph): void => {
                    graph.resetSpatialEdges();
                    graph.setFilter(filter);
                }),
            map(
                (): void => {
                    return undefined;
                }));
    }

    /**
     * Set the graph mode.
     *
     * @description If graph mode is set to spatial, caching
     * is performed with emphasis on spatial edges. If graph
     * mode is set to sequence no tile data is requested and
     * no spatial edges are computed.
     *
     * When setting graph mode to sequence all spatial
     * subscriptions are aborted.
     *
     * @param {GraphMode} mode - Graph mode to set.
     */
    public setGraphMode(mode: GraphMode): void {
        if (this._graphMode === mode) {
            return;
        }

        if (mode === GraphMode.Sequence) {
            this._resetSubscriptions(this._spatialSubscriptions);
        }

        this._graphMode = mode;
        this._graphModeSubject$.next(this._graphMode);
    }

    /**
     * Reset the graph.
     *
     * @description Resets the graph but keeps the nodes of the
     * supplied keys.
     *
     * @param {Array<string>} keepKeys - Keys of nodes to keep in graph.
     * @return {Observable<Node>} Observable emitting a single item,
     * the graph, when it has been reset.
     */
    public reset$(keepKeys: string[]): Observable<void> {
        this._abortSubjects(this._firstGraphSubjects$);
        this._resetSubscriptions(this._initializeCacheSubscriptions);
        this._resetSubscriptions(this._sequenceSubscriptions);
        this._resetSubscriptions(this._spatialSubscriptions);

        return this._graph$.pipe(
            first(),
            tap(
                (graph: Graph): void => {
                    graph.reset(keepKeys);
                }),
            map(
                (): void => {
                    return undefined;
                }));
    }

    /**
     * Uncache the graph.
     *
     * @description Uncaches the graph by removing tiles, nodes and
     * sequences. Keeps the nodes of the supplied keys and the tiles
     * related to those nodes.
     *
     * @param {Array<string>} keepKeys - Keys of nodes to keep in graph.
     * @param {string} keepSequenceKey - Optional key of sequence
     * for which the belonging nodes should not be disposed or
     * removed from the graph. These nodes may still be uncached if
     * not specified in keep keys param.
     * @return {Observable<Graph>} Observable emitting a single item,
     * the graph, when the graph has been uncached.
     */
    public uncache$(keepKeys: string[], keepSequenceKey?: string): Observable<void> {
        return this._graph$.pipe(
            first(),
            tap(
                (graph: Graph): void => {
                    graph.uncache(keepKeys, keepSequenceKey);
                }),
            map(
                (): void => {
                    return undefined;
                }));
    }

    private _abortSubjects<T>(subjects: Subject<T>[]): void {
        for (const subject of subjects.slice()) {
            this._removeFromArray(subject, subjects);

            subject.error(new Error("Cache node request was aborted."));
        }
    }

    private _removeFromArray<T>(object: T, objects: T[]): void {
        const index: number = objects.indexOf(object);
        if (index !== -1) {
            objects.splice(index, 1);
        }
    }

    private _resetSubscriptions(subscriptions: Subscription[]): void {
        for (const subscription of subscriptions.slice()) {
            this._removeFromArray(subscription, subscriptions);

            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        }
    }
}

export default GraphService;
