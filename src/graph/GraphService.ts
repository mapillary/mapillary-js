/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IAPINavIm, APIv2} from "../API";
import {Graph, ImageLoadingService, Node, TilesService} from "../Graph";

interface IGraphOperation extends Function {
    (graph: Graph): Graph;
}

export class GraphService {
    private _updates$: rx.Subject<any> = new rx.Subject<any>();

    private _cache$: rx.Subject<any> = new rx.Subject<any>();
    private _cachedNode$: rx.ConnectableObservable<Node>;
    private _loadingNode$: rx.ConnectableObservable<Node>;

    private _graph$: rx.Observable<Graph>;

    private _tilesService: TilesService;
    private _imageLoadingService: ImageLoadingService;

    constructor (apiV2: APIv2) {
        this._tilesService = new TilesService(apiV2);
        this._imageLoadingService = new ImageLoadingService();

        this._graph$ = this._updates$
            .scan<Graph>(
            (graph: Graph, operation: IGraphOperation): Graph => {
                let newGraph: Graph = operation(graph);
                newGraph.evictNodeCache();
                return newGraph;
            },
            new Graph())
            .shareReplay(1);

        this._graph$.subscribe();
        this._updates$.onNext((graph: Graph): Graph => {
            return graph;
        });

        this._loadingNode$ = this._cache$.distinct((node: Node): string => {
            return node.key + node.lastCacheEvict;
        }).flatMap<Node>((node: Node): rx.Observable<Node> => {
            return node.cacheAssets();
        }).publish();
        this._loadingNode$.connect();
        this._loadingNode$.subscribe(this._imageLoadingService.loadnode$);

        this._cachedNode$ = this._loadingNode$.filter((node: Node): boolean => {
            return (!!node.image && !!node.mesh);
        }).publish();
        this._cachedNode$.connect();
        this._cachedNode$.subscribe(this._tilesService.cacheNode$);

        this._cachedNode$.map((node: Node) => {
            return (graph: Graph): Graph => {
                graph.cacheNode(node);
                return graph;
            };
        }).subscribe(this._updates$);

        // fixme keep this value inside state (find correct combiner instead of combineLatest)
        let lastData: IAPINavIm;
        this._tilesService.tiles$
            .combineLatest(this._tilesService.cachedTiles$, (data: IAPINavIm, tiles: {[key: string]: boolean}): IGraphOperation => {
                return (graph: Graph): Graph => {
                    if (lastData === data) {
                        return graph;
                    }
                    lastData = data;

                    graph.addNodesFromAPI(data, tiles);
                    return graph;
                };
        }).subscribe(this._updates$);
    }

    public get graph$(): rx.Observable<Graph> {
        return this._graph$;
    }

    public get imageLoadingService(): ImageLoadingService {
        return this._imageLoadingService;
    }

    public node$(key: string): rx.Observable<Node> {
        return this._graph$.skipWhile((graph: Graph) => {
            let node: Node = graph.getNode(key);
            if (node == null) {
                this._tilesService.cacheIm$.onNext(key);
                return true;
            }

            if (!node.worthy) {
                this._tilesService.cacheNodeH$.onNext(node);
                return true;
            }

            if (!node.cached) {
                this._cache$.onNext(node);
                return true;
            }

            return false;
        }).map<Node>((graph: Graph): Node => {
            return graph.getNode(key);
        }).take(1);
    }

    public nextNode$(node: Node, dir: number): rx.Observable<Node> {
        if (!node.cached) {
            rx.Observable.throw<Node>(new Error("node is not yet cached"));
        }

        return this._graph$
            .map<string>(
                (graph: Graph): string => {
                    let nextNode: Node = graph.nextNode(node, dir);
                    return nextNode == null ? null : nextNode.key;
                })
            .distinct()
            .flatMap<Node>(
                (key: string): rx.Observable<Node> => {
                    return key == null ?
                        rx.Observable.just<Node>(null) :
                        this.node$(key);
                });
    }
}

export default GraphService;
