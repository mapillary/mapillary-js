import {ConnectableObservable} from "rxjs/observable/ConnectableObservable";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/throw";

import "rxjs/add/operator/catch";
import "rxjs/add/operator/concat";
import "rxjs/add/operator/distinct";
import "rxjs/add/operator/do";
import "rxjs/add/operator/expand";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/finally";
import "rxjs/add/operator/first";
import "rxjs/add/operator/last";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/publish";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/skipWhile";
import "rxjs/add/operator/take";

import {IAPINavIm, APIv2, APIv3} from "../API";
import {EdgeDirection} from "../Edge";
import {VectorTilesService, Graph, NewGraph, ImageLoadingService, Node, NewNode, Sequence, TilesService} from "../Graph";

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

interface IGraphOperation extends Function {
    (graph: Graph): Graph;
}

export class GraphService {
    private _updates$: Subject<any> = new Subject<any>();

    private _cache$: Subject<any> = new Subject<any>();
    private _cachedNode$: ConnectableObservable<Node>;
    private _loadingNode$: ConnectableObservable<Node>;

    private _graph$: Observable<Graph>;

    private _tilesService: TilesService;
    private _vectorTilesService: VectorTilesService;

    constructor (apiV2: APIv2, apiV3: APIv3) {
        this._tilesService = new TilesService(apiV2);
        this._vectorTilesService = new VectorTilesService(apiV3);

        this._graph$ = this._updates$
            .scan<Graph>(
                (graph: Graph, operation: IGraphOperation): Graph => {
                    return operation(graph);
                },
                new Graph())
            .publishReplay(1)
            .refCount();

        this._graph$.subscribe();

        this._updates$
            .next(
                (graph: Graph): Graph => {
                    return graph;
                });

        this._loadingNode$ = this._cache$
            .distinct(
                (n1: Node, n2: Node): boolean => {
                    return n1.key === n2.key;
                })
            .mergeMap<Node>(
                (node: Node): Observable<Node> => {
                    return node.cacheAssets();
                })
            .publish();

        this._loadingNode$.connect();

        this._cachedNode$ = this._loadingNode$
            .filter(
                (node: Node): boolean => {
                    return (!!node.image && !!node.mesh);
                })
            .publish();

        this._cachedNode$.connect();
        this._cachedNode$.subscribe(this._vectorTilesService.cacheNode$);

        this._cachedNode$
            .map(
                (node: Node) => {
                    return (graph: Graph): Graph => {
                        graph.cacheNode(node);
                        return graph;
                    };
                })
            .subscribe(this._updates$);

        // fixme keep this value inside state (find correct combiner instead of combineLatest)
        let lastData: IAPINavIm;
        this._tilesService.tiles$
            .combineLatest(
                this._tilesService.cachedTiles$,
                (data: IAPINavIm, tiles: {[key: string]: boolean}): IGraphOperation => {
                    return (graph: Graph): Graph => {
                        if (lastData === data) {
                            return graph;
                        }

                        lastData = data;

                        graph.addNodesFromAPI(data, tiles);
                        return graph;
                    };
                })
            .subscribe(this._updates$);
    }

    public get graph$(): Observable<Graph> {
        return this._graph$;
    }

    public get vectorTilesService(): VectorTilesService {
        return this._vectorTilesService;
    }

    public node$(key: string): Observable<Node> {
        return this._graph$
            .skipWhile(
                (graph: Graph) => {
                    let node: Node = graph.getNode(key);
                    if (node == null) {
                        this._tilesService.cacheIm$.next(key);
                        return true;
                    }

                    if (!node.worthy) {
                        this._tilesService.cacheNodeH$.next(node);
                        return true;
                    }

                    if (!node.edgesCached) {
                        this._cache$.next(node);
                        return true;
                    }

                    return false;
                })
            .map<Node>(
                (graph: Graph): Node => {
                    return graph.getNode(key);
                })
            .take(1);
    }

    public nextNode$(node: Node, dir: EdgeDirection): Observable<Node> {
        if (!node.edgesCached) {
            Observable.throw<Node>(new Error("node is not yet cached"));
        }

        return this._graph$
            .map<string>(
                (graph: Graph): string => {
                    return graph.nextKey(node, dir);
                })
            .distinct()
            .mergeMap<Node>(
                (key: string): Observable<Node> => {
                    return key == null ?
                        Observable.throw<Node>(new Error("no Image in direction")) :
                        this.node$(key);
                });
    }
}

export default GraphService;
