import {ConnectableObservable} from "rxjs/observable/ConnectableObservable";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/throw";

import "rxjs/add/operator/distinct";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/publish";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/skipWhile";
import "rxjs/add/operator/take";

import {IAPINavIm, APIv2, APIv3} from "../API";
import {EdgeDirection} from "../Edge";
import {VectorTilesService, Graph, NewGraph, ImageLoadingService, Node, NewNode, TilesService} from "../Graph";

export class NewGraphService {
    private _graph$: Observable<NewGraph>;

    constructor(graph: NewGraph) {
        this._graph$ = Observable
            .of(graph)
            .concat(graph.changed$)
            .publishReplay(1)
            .refCount();

        this._graph$.subscribe();
    }

    public cacheNode$(key: string): Observable<NewNode> {
        let firstGraph$: Observable<NewGraph> = this._graph$
            .skipWhile(
                (graph: NewGraph): boolean => {
                    if (!graph.hasNode(key)) {
                        if (!graph.fetching(key)) {
                            graph.fetch(key);
                        }

                        return true;
                    }

                    if (!graph.getNode(key).full) {
                        if (!graph.filling(key)) {
                            graph.fill(key);
                        }

                        return true;
                    }

                    return false;
                })
            .first()
            .do(
                (graph: NewGraph): void => {
                    if (!graph.nodeCacheInitialized(key)) {
                        graph.initializeNodeCache(key);
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
            .first(
                (node: NewNode): boolean => {
                    return node.assetsCached;
                })
            .publishReplay(1)
            .refCount();

        node$.subscribe();

        let graph$: Observable<NewGraph> = firstGraph$
            .concat(
                firstGraph$
                    .mergeMap(
                        (graph: NewGraph): Observable<NewGraph> => {
                            return graph.changed$;
                        }))
            .publishReplay(1)
            .refCount();

        graph$
            .skipWhile(
                (graph: NewGraph): boolean => {
                    if (!graph.hasNode(key)) {
                        return false;
                    }

                    if (!graph.sequenceCached(key)) {
                        if (!graph.cachingSequence(key)) {
                            graph.cacheSequence(key);
                        }

                        return true;
                    }

                    if (!graph.getNode(key).sequenceEdgesCached) {
                        graph.cacheSequenceEdges(key);
                    }

                    return false;
                })
            .first()
            .subscribe();

        graph$
            .skipWhile(
                (graph: NewGraph): boolean => {
                    if (!graph.hasNode(key)) {
                        return false;
                    }

                    if (!graph.tilesCached(key)) {
                        if (!graph.cachingTiles(key)) {
                            graph.cacheTiles(key);
                        }

                        return true;
                    }

                    if (!graph.spatialNodesCached(key)) {
                        if (!graph.cachingSpatialNodes(key)) {
                            graph.cacheSpatialNodes(key);
                        }

                        return true;
                    }

                    if (!graph.sequenceCached(key)) {
                        return true;
                    }

                    if (!graph.getNode(key).spatialEdgesCached) {
                        graph.cacheSpatialEdges(key);
                    }

                    return false;
                })
            .first()
            .subscribe();

        return node$;
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
    private _imageLoadingService: ImageLoadingService;

    constructor (apiV2: APIv2, apiV3: APIv3) {
        this._tilesService = new TilesService(apiV2);
        this._vectorTilesService = new VectorTilesService(apiV3);
        this._imageLoadingService = new ImageLoadingService();

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
        this._loadingNode$.subscribe(this._imageLoadingService.loadnode$);

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

    public get imageLoadingService(): ImageLoadingService {
        return this._imageLoadingService;
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
