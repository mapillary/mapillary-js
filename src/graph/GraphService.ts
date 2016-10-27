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
    Graph,
    ImageLoadingService,
    Node,
    Sequence,
} from "../Graph";

export class GraphService {
    private _graph$: Observable<Graph>;

    private _imageLoadingService: ImageLoadingService;

    private _spatialSubscriptions: Subscription[];

    constructor(graph: Graph, imageLoadingService: ImageLoadingService) {
        this._graph$ = Observable
            .of(graph)
            .concat(graph.changed$)
            .publishReplay(1)
            .refCount();

        this._graph$.subscribe();

        this._imageLoadingService = imageLoadingService;

        this._spatialSubscriptions = [];
    }

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

        firstGraph$
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
            .subscribe(
                (graph: Graph): void => { return; },
                (error: Error): void => {
                    console.error(`Failed to cache sequence edges (${key}).`, error);
                });

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
                    if (graph.isSpatialAreaCached(key)) {
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

    public reset$(key: string): Observable<Node> {
        this._resetSpatialSubscriptions();

        return this._graph$
            .first()
            .do(
                (graph: Graph): void => {
                    graph.reset();
                })
            .mergeMap(
                (graph: Graph): Observable<Node> => {
                    return this.cacheNode$(key);
                });
    }

    private _removeSpatialSubscription(spatialSubscription: Subscription): void {
        let index: number = this._spatialSubscriptions.indexOf(spatialSubscription);
        if (index > -1) {
            this._spatialSubscriptions.splice(index, 1);
        }
    }

    private _resetSpatialSubscriptions(): void {
        for (let subscription of this._spatialSubscriptions) {
            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        }

        this._spatialSubscriptions = [];
    }
}

export default GraphService;
