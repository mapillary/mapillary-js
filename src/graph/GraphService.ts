import {Observable} from "rxjs/Observable";
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

    private _imageLoadingService: ImageLoadingService;

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

        this._graph$.subscribe();

        this._imageLoadingService = imageLoadingService;

        this._sequenceSubscriptions = [];
        this._spatialSubscriptions = [];
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
        let firstGraph$: Observable<Graph> = this._graph$
            .first()
            .mergeMap<Graph>(
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
            .publishReplay(1)
            .refCount();

        let node$: Observable<Node> = firstGraph$
            .map<Node>(
                (graph: Graph): Node => {
                    return graph.getNode(key);
                })
            .mergeMap<Node>(
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

        let sequenceSubscription: Subscription = firstGraph$
            .mergeMap<Graph>(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingNodeSequence(key) || !graph.hasNodeSequence(key)) {
                        return graph.cacheNodeSequence$(key);
                    }

                    return Observable.of<Graph>(graph);
                })
            .do(
                (graph: Graph): void => {
                    if (!graph.getNode(key).sequenceEdges.cached) {
                        graph.cacheSequenceEdges(key);
                    }
                })
            .finally((): void => {
                    if (sequenceSubscription == null) {
                        return;
                    }

                    this._removeSequenceSubscription(sequenceSubscription);
                })
            .subscribe(
                (graph: Graph): void => { return; },
                (error: Error): void => {
                    console.error(`Failed to cache sequence edges (${key}).`, error);
                });

        if (!sequenceSubscription.closed) {
            this._sequenceSubscriptions.push(sequenceSubscription);
        }

        let spatialSubscription: Subscription = firstGraph$
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
                                    .mergeMap<Graph>(
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
            .mergeMap<Graph>(
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
            .mergeMap<Graph>(
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
            .finally((): void => {
                    if (spatialSubscription == null) {
                        return;
                    }

                    this._removeSpatialSubscription(spatialSubscription);
                })
            .subscribe(
                (graph: Graph): void => { return; },
                (error: Error): void => {
                    console.error(`Failed to cache spatial edges (${key}).`, error);
                });

        if (!spatialSubscription.closed) {
            this._spatialSubscriptions.push(spatialSubscription);
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
            .mergeMap<Graph>(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequence(sequenceKey) || !graph.hasSequence(sequenceKey)) {
                        return graph.cacheSequence$(sequenceKey);
                    }

                    return Observable.of<Graph>(graph);
                })
            .map<Sequence>(
                (graph: Graph): Sequence => {
                    return graph.getSequence(sequenceKey);
                });
    }

    /**
     * Set a spatial edge filter on the graph.
     *
     * @description Resets the spatial edges of all cached nodes and
     * re-caches the spatial edges of the provided node.
     *
     * @param {string} key - Key of the node to cache edges for after reset.
     * @param {FilterExpression} filter - Filter expression to be applied.
     * @return {Observable<Node>} Observable emitting a single item,
     * the node, when it has been retrieved and its assets are cached.
     * @throws {Error} Propagates any IO node caching errors to the caller.
     */
    public setFilter$(key: string, filter: FilterExpression): Observable<Node> {
        this._resetSpatialSubscriptions();

        return this._graph$
            .first()
            .do(
                (graph: Graph): void => {
                    graph.resetSpatialEdges();
                    graph.setFilter(filter);
                })
            .mergeMap(
                (graph: Graph): Observable<Node> => {
                    return this.cacheNode$(key);
                });
    }

    /**
     * Reset the graph.
     *
     * @description Resets the graph but keeps the nodes of the
     * supplied keys. After reset the node of supplied key is
     * cached again.
     *
     * @param {string} cacheKey - Key of the node to cache edges for after reset.
     * @param {Array<string>} keepKeys - Keys of nodes to keep in graph.
     * @return {Observable<Node>} Observable emitting a single item,
     * the node, when it has been retrieved and its assets are cached.
     * @throws {Error} Propagates any IO node caching errors to the caller.
     */
    public reset$(cacheKey: string, keepKeys: string[]): Observable<Node> {
        this._resetSequenceSubscriptions();
        this._resetSpatialSubscriptions();

        return this._graph$
            .first()
            .do(
                (graph: Graph): void => {
                    graph.reset(keepKeys);
                })
            .mergeMap(
                (graph: Graph): Observable<Node> => {
                    return this.cacheNode$(cacheKey);
                });
    }

    private _removeSequenceSubscription(sequenceSubscription: Subscription): void {
        let index: number = this._sequenceSubscriptions.indexOf(sequenceSubscription);
        if (index !== -1) {
            this._sequenceSubscriptions.splice(index, 1);
        }
    }

    private _resetSequenceSubscriptions(): void {
        for (let subscription of this._sequenceSubscriptions.slice()) {
            this._removeSequenceSubscription(subscription);

            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        }

        this._sequenceSubscriptions = [];
    }

    private _removeSpatialSubscription(spatialSubscription: Subscription): void {
        let index: number = this._spatialSubscriptions.indexOf(spatialSubscription);
        if (index !== -1) {
            this._spatialSubscriptions.splice(index, 1);
        }
    }

    private _resetSpatialSubscriptions(): void {
        for (let subscription of this._spatialSubscriptions.slice()) {
            this._removeSpatialSubscription(subscription);

            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        }

        this._spatialSubscriptions = [];
    }
}

export default GraphService;
