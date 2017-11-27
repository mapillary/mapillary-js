import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/operator/catch";
import "rxjs/add/operator/concat";
import "rxjs/add/operator/do";
import "rxjs/add/operator/expand";
import "rxjs/add/operator/finally";
import "rxjs/add/operator/first";
import "rxjs/add/operator/last";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/publishReplay";

import {
    FilterExpression,
    Graph,
    GraphMode,
    ImageLoadingService,
    Node,
    Sequence,
} from "../Graph";

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

    private _imageLoadingService: ImageLoadingService;

    private _firstGraphSubjects$: Subject<Graph>[];

    private _initializeCacheSubscriptions: Subscription[];
    private _sequenceNodesSubscriptions: Subscription[];
    private _sequenceSubscriptions: Subscription[];
    private _spatialSubscriptions: Subscription[];

    /**
     * Create a new graph service instance.
     *
     * @param {Graph} graph - Graph instance to be operated on.
     */
    constructor(graph: Graph, imageLoadingService: ImageLoadingService) {
        this._graph$ = Observable
            .of(graph)
            .concat(graph.changed$)
            .publishReplay(1)
            .refCount();

        this._graph$.subscribe(() => { /*noop*/ });

        this._graphMode = GraphMode.Spatial;
        this._graphModeSubject$ = new Subject<GraphMode>();
        this._graphMode$ = this._graphModeSubject$
            .startWith(this._graphMode)
            .publishReplay(1)
            .refCount();

        this._graphMode$.subscribe(() => { /*noop*/ });

        this._imageLoadingService = imageLoadingService;

        this._firstGraphSubjects$ = [];

        this._initializeCacheSubscriptions = [];
        this._sequenceNodesSubscriptions = [];
        this._sequenceSubscriptions = [];
        this._spatialSubscriptions = [];
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

        const firstGraph$: Observable<Graph> = firstGraphSubject$
            .publishReplay(1)
            .refCount();

        const node$: Observable<Node> = firstGraph$
            .map(
                (graph: Graph): Node => {
                    return graph.getNode(key);
                })
            .mergeMap(
                (node: Node): Observable<Node> => {
                    return node.assetsCached ?
                        Observable.of(node) :
                        node.cacheAssets$();
                })
            .publishReplay(1)
            .refCount();

        node$.subscribe(
            (node: Node): void => {
                this._imageLoadingService.loadnode$.next(node);
            },
            (error: Error): void => {
                console.error(`Failed to cache node (${key})`, error);
            });

        const initializeCacheSubscription: Subscription = this._graph$
            .first()
            .mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingFull(key) || !graph.hasNode(key)) {
                        return graph.cacheFull$(key);
                    }

                    if (graph.isCachingFill(key) || !graph.getNode(key).full) {
                        return graph.cacheFill$(key);
                    }

                    return Observable.of<Graph>(graph);
                })
            .do(
                (graph: Graph): void => {
                    if (!graph.hasInitializedCache(key)) {
                        graph.initializeCache(key);
                    }
                })
            .finally(
                (): void => {
                    if (initializeCacheSubscription == null) {
                        return;
                    }

                    this._removeFromArray(initializeCacheSubscription, this._initializeCacheSubscriptions);
                    this._removeFromArray(firstGraphSubject$, this._firstGraphSubjects$);
                })
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

        const graphSequence$: Observable<Graph> = firstGraph$
            .mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingNodeSequence(key) || !graph.hasNodeSequence(key)) {
                        return graph.cacheNodeSequence$(key);
                    }

                    return Observable.of<Graph>(graph);
                })
            .publishReplay(1)
            .refCount();

        if (this._graphMode === GraphMode.Sequence) {
            const sequenceNodesSubscription: Subscription = graphSequence$
                .mergeMap(
                    (graph: Graph): Observable<Graph> => {
                        const sequenceKey: string = graph.getNode(key).sequenceKey;

                        if (graph.isCachingSequenceNodes(sequenceKey) || !graph.hasSequenceNodes(sequenceKey)) {
                            return graph.cacheSequenceNodes$(sequenceKey);
                        }

                        return Observable.of<Graph>(graph);
                    })
                .finally(
                    (): void => {
                        if (sequenceNodesSubscription == null) {
                            return;
                        }

                        this._removeFromArray(sequenceNodesSubscription, this._sequenceNodesSubscriptions);
                    })
                .subscribe(
                    (graph: Graph): void => { /*noop*/ },
                    (error: Error): void => {
                        console.error(`Failed to cache sequence nodes (${key}).`, error);
                    });

            if (!sequenceNodesSubscription.closed) {
                this._sequenceNodesSubscriptions.push(sequenceNodesSubscription);
            }
        }

        const sequenceSubscription: Subscription = graphSequence$
            .do(
                (graph: Graph): void => {
                    if (!graph.getNode(key).sequenceEdges.cached) {
                        graph.cacheSequenceEdges(key);
                    }
                })
            .finally(
                (): void => {
                    if (sequenceSubscription == null) {
                        return;
                    }

                    this._removeFromArray(sequenceSubscription, this._sequenceSubscriptions);
                })
            .subscribe(
                (graph: Graph): void => { return; },
                (error: Error): void => {
                    console.error(`Failed to cache sequence edges (${key}).`, error);
                });

        if (!sequenceSubscription.closed) {
            this._sequenceSubscriptions.push(sequenceSubscription);
        }

        if (this._graphMode === GraphMode.Spatial) {
            const spatialSubscription: Subscription = firstGraph$
                .expand(
                    (graph: Graph): Observable<Graph> => {
                        if (graph.hasTiles(key)) {
                            return Observable.empty<Graph>();
                        }

                        return Observable
                            .from<Observable<Graph>>(graph.cacheTiles$(key))
                            .mergeMap(
                                (graph$: Observable<Graph>): Observable<Graph> => {
                                    return graph$
                                        .mergeMap(
                                            (g: Graph): Observable<Graph> => {
                                                if (g.isCachingTiles(key)) {
                                                    return Observable.empty<Graph>();
                                                }

                                                return Observable.of<Graph>(g);
                                            })
                                        .catch(
                                            (error: Error, caught$: Observable<Graph>): Observable<Graph> => {
                                                console.error(`Failed to cache tile data (${key}).`, error);

                                                return Observable.empty<Graph>();
                                            });
                                });
                    })
                .last()
                .mergeMap(
                    (graph: Graph): Observable<Graph> => {
                        if (graph.hasSpatialArea(key)) {
                            return Observable.of<Graph>(graph);
                        }

                        return Observable
                            .from<Observable<Graph>>(graph.cacheSpatialArea$(key))
                            .mergeMap(
                                (graph$: Observable<Graph>): Observable<Graph> => {
                                    return graph$
                                        .catch(
                                            (error: Error, caught$: Observable<Graph>): Observable<Graph> => {
                                                console.error(`Failed to cache spatial nodes (${key}).`, error);

                                                return Observable.empty<Graph>();
                                            });
                                });
                    })
                .last()
                .mergeMap(
                    (graph: Graph): Observable<Graph> => {
                        return graph.hasNodeSequence(key) ?
                            Observable.of<Graph>(graph) :
                            graph.cacheNodeSequence$(key);
                    })
                .do(
                    (graph: Graph): void => {
                        if (!graph.getNode(key).spatialEdges.cached) {
                            graph.cacheSpatialEdges(key);
                        }
                    })
                .finally(
                    (): void => {
                        if (spatialSubscription == null) {
                            return;
                        }

                        this._removeFromArray(spatialSubscription, this._spatialSubscriptions);
                    })
                .subscribe(
                    (graph: Graph): void => { return; },
                    (error: Error): void => {
                        console.error(`Failed to cache spatial edges (${key}).`, error);
                    });

            if (!spatialSubscription.closed) {
                this._spatialSubscriptions.push(spatialSubscription);
            }
        }

        return node$
            .first(
                (node: Node): boolean => {
                    return node.assetsCached;
                });
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
        return this._graph$
            .first()
            .mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequence(sequenceKey) || !graph.hasSequence(sequenceKey)) {
                        return graph.cacheSequence$(sequenceKey);
                    }

                    return Observable.of<Graph>(graph);
                })
            .map(
                (graph: Graph): Sequence => {
                    return graph.getSequence(sequenceKey);
                });
    }

    /**
     * Cache a sequence and its nodes in the graph and retrieve the sequence.
     *
     * @description Caches a sequence and its assets are cached and
     * retrieves all nodes belonging to the sequence. The node assets
     * or edges will not be cached.
     *
     * @param {string} sequenceKey - Sequence key.
     * @returns {Observable<Sequence>} Observable emitting a single item,
     * the sequence, when it has been retrieved, its assets are cached and
     * all nodes belonging to the sequence has been retrieved.
     * @throws {Error} Propagates any IO node caching errors to the caller.
     */
    public cacheSequenceNodes$(sequenceKey: string): Observable<Sequence> {
        return this._graph$
            .first()
            .mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequence(sequenceKey) || !graph.hasSequence(sequenceKey)) {
                        return graph.cacheSequence$(sequenceKey);
                    }

                    return Observable.of<Graph>(graph);
                })
            .mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequenceNodes(sequenceKey) || !graph.hasSequenceNodes(sequenceKey)) {
                        return graph.cacheSequenceNodes$(sequenceKey);
                    }

                    return Observable.of<Graph>(graph);
                })
            .map(
                (graph: Graph): Sequence => {
                    return graph.getSequence(sequenceKey);
                });
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
    public setFilter$(filter: FilterExpression): Observable<Graph> {
        this._resetSubscriptions(this._spatialSubscriptions);

        return this._graph$
            .first()
            .do(
                (graph: Graph): void => {
                    graph.resetSpatialEdges();
                    graph.setFilter(filter);
                });
    }

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
    public reset$(keepKeys: string[]): Observable<Graph> {
        this._abortSubjects(this._firstGraphSubjects$);
        this._resetSubscriptions(this._initializeCacheSubscriptions);
        this._resetSubscriptions(this._sequenceNodesSubscriptions);
        this._resetSubscriptions(this._sequenceSubscriptions);
        this._resetSubscriptions(this._spatialSubscriptions);

        return this._graph$
            .first()
            .do(
                (graph: Graph): void => {
                    graph.reset(keepKeys);
                });
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
     * removed from the graph.
     * @return {Observable<Graph>} Observable emitting a single item,
     * the graph, when the graph has been uncached.
     */
    public uncache$(keepKeys: string[], keepSequenceKey?: string): Observable<Graph> {
        return this._graph$
            .first()
            .do(
                (graph: Graph): void => {
                    graph.uncache(keepKeys, keepSequenceKey);
                });
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
