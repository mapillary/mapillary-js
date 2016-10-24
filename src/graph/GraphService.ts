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
    NewGraph,
    ImageLoadingService,
    NewNode,
    Sequence,
} from "../Graph";

export class NewGraphService {
    private _graph$: Observable<NewGraph>;

    private _imageLoadingService: ImageLoadingService;

    private _spatialSubscriptions: Subscription[];

    constructor(graph: NewGraph) {
        this._graph$ = Observable
            .of(graph)
            .concat(graph.changed$)
            .publishReplay(1)
            .refCount();

        this._graph$.subscribe();

        this._imageLoadingService = new ImageLoadingService();

        this._spatialSubscriptions = [];
    }

    public get imageLoadingService(): ImageLoadingService {
        return this._imageLoadingService;
    }

    public cacheNode$(key: string): Observable<NewNode> {
        let firstGraph$: Observable<NewGraph> = this._graph$
            .first()
            .mergeMap<NewGraph>(
                (graph: NewGraph): Observable<NewGraph> => {
                    if (graph.isCachingFull(key) || !graph.hasNode(key)) {
                        return graph.cacheFull$(key);
                    }

                    if (graph.isCachingFill(key) || !graph.getNode(key).full) {
                        return graph.cacheFill$(key);
                    }

                    return Observable.of<NewGraph>(graph);
                })
            .do(
                (graph: NewGraph): void => {
                    if (!graph.hasInitializedCache(key)) {
                        graph.initializeCache(key);
                    }
                })
            .publishReplay(1)
            .refCount();

        let node$: Observable<NewNode> = firstGraph$
            .map<NewNode>(
                (graph: NewGraph): NewNode => {
                    return graph.getNode(key);
                })
            .mergeMap<NewNode>(
                (node: NewNode): Observable<NewNode> => {
                    return node.assetsCached ?
                        Observable.of(node) :
                        node.cacheAssets$();
                })
            .publishReplay(1)
            .refCount();

        node$.subscribe(
            (node: NewNode): void => {
                this._imageLoadingService.loadnode$.next(node);
            },
            (error: Error): void => {
                console.error(`Failed to cache node (${key})`, error);
            });

        firstGraph$
            .mergeMap<NewGraph>(
                (graph: NewGraph): Observable<NewGraph> => {
                    if (graph.isCachingNodeSequence(key) || !graph.hasNodeSequence(key)) {
                        return graph.cacheNodeSequence$(key);
                    }

                    return Observable.of<NewGraph>(graph);
                })
            .do(
                (graph: NewGraph): void => {
                    if (!graph.getNode(key).sequenceEdges.cached) {
                        graph.cacheSequenceEdges(key);
                    }
                })
            .subscribe(
                (graph: NewGraph): void => { return; },
                (error: Error): void => {
                    console.error(`Failed to cache sequence edges (${key}).`, error);
                });

        let spatialSubscription: Subscription = firstGraph$
            .expand(
                (graph: NewGraph): Observable<NewGraph> => {
                    if (graph.hasTiles(key)) {
                        return Observable.empty<NewGraph>();
                    }

                    return Observable
                        .from<Observable<NewGraph>>(graph.cacheTiles$(key))
                        .mergeMap(
                            (graph$: Observable<NewGraph>): Observable<NewGraph> => {
                                return graph$
                                    .mergeMap<NewGraph>(
                                        (g: NewGraph): Observable<NewGraph> => {
                                            if (g.isCachingTiles(key)) {
                                                return Observable.empty<NewGraph>();
                                            }

                                            return Observable.of<NewGraph>(g);
                                        })
                                    .catch(
                                        (error: Error, caught$: Observable<NewGraph>): Observable<NewGraph> => {
                                            console.error(`Failed to cache tile data (${key}).`, error);

                                            return Observable.empty<NewGraph>();
                                        });
                            });
                })
            .last()
            .mergeMap<NewGraph>(
                (graph: NewGraph): Observable<NewGraph> => {
                    if (graph.isSpatialAreaCached(key)) {
                        return Observable.of<NewGraph>(graph);
                    }

                    return Observable
                        .from<Observable<NewGraph>>(graph.cacheSpatialArea$(key))
                        .mergeMap(
                            (graph$: Observable<NewGraph>): Observable<NewGraph> => {
                                return graph$
                                    .catch(
                                        (error: Error, caught$: Observable<NewGraph>): Observable<NewGraph> => {
                                            console.error(`Failed to cache spatial nodes (${key}).`, error);

                                            return Observable.empty<NewGraph>();
                                        });
                            });
                })
            .last()
            .mergeMap<NewGraph>(
                (graph: NewGraph): Observable<NewGraph> => {
                    return graph.hasNodeSequence(key) ?
                        Observable.of<NewGraph>(graph) :
                        graph.cacheNodeSequence$(key);
                })
            .do(
                (graph: NewGraph): void => {
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
                (graph: NewGraph): void => { return; },
                (error: Error): void => {
                    console.error(`Failed to cache spatial edges (${key}).`, error);
                });

        if (!spatialSubscription.closed) {
            this._spatialSubscriptions.push(spatialSubscription);
        }

        return node$
            .first(
                (node: NewNode): boolean => {
                    return node.assetsCached;
                });
    }

    public cacheSequence$(sequenceKey: string): Observable<Sequence> {
        return this._graph$
            .first()
            .mergeMap<NewGraph>(
                (graph: NewGraph): Observable<NewGraph> => {
                    if (graph.isCachingSequence(sequenceKey) || !graph.hasSequence(sequenceKey)) {
                        return graph.cacheSequence$(sequenceKey);
                    }

                    return Observable.of<NewGraph>(graph);
                })
            .map<Sequence>(
                (graph: NewGraph): Sequence => {
                    return graph.getSequence(sequenceKey);
                });
    }

    public reset$(key: string): Observable<NewNode> {
        this._resetSpatialSubscriptions();

        return this._graph$
            .first()
            .do(
                (graph: NewGraph): void => {
                    graph.reset();
                })
            .mergeMap(
                (graph: NewGraph): Observable<NewNode> => {
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

export default NewGraphService;
