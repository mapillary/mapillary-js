/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IAPINavIm, APIv2} from "../API";
import {Graph, Node, TilesService} from "../Graph";

interface IGraphOperation extends Function {
    (graph: Graph): Graph;
}

export class GraphService {
    private _updates$: rx.Subject<any> = new rx.Subject<any>();

    private _cache$: rx.Subject<any> = new rx.Subject<any>();
    private _cachedNode$: rx.Observable<Node>;

    private _graph$: rx.Observable<Graph>;

    private _tilesService: TilesService;

    constructor (apiV2: APIv2) {
        this._tilesService = new TilesService(apiV2);

        // operation pattern updating the graph
        this._graph$ = this._updates$
            .scan<Graph>(
            (graph: Graph, operation: IGraphOperation): Graph => {
                let newGraph: Graph = operation(graph);
                newGraph.evictNodeCache();
                return newGraph;
            },
            new Graph())
            .shareReplay(1);

        // always keep the graph running also initiate it to empty
        this._graph$.subscribe();
        this._updates$.onNext((graph: Graph): Graph => {
            return graph;
        });

        // stream of cached nodes, uses distinct to not cache a node more than once
        this._cachedNode$ = this._cache$.distinct((node: Node): string => {
            return node.key + node.lastCacheEvict;
        }).flatMap<Node>((node: Node): rx.Observable<Node> => {
            return node.cacheAssets();
        });

        // make tilesservice aware of that a new node is beeing cached
        this._cachedNode$.subscribe(this._tilesService.cacheNode$);

        // save the cached node to the graph, cache its edges
        this._cachedNode$.map((node: Node) => {
            return (graph: Graph): Graph => {
                graph.cacheNode(node);
                return graph;
            };
        }).subscribe(this._updates$);

        // feedback from tiles service adding fresh tiles to the graph
        this._tilesService.tiles$.map((data: IAPINavIm): IGraphOperation => {
            return (graph: Graph): Graph => {
                graph.addNodesFromAPI(data);
                return graph;
            };
        }).subscribe(this._updates$);
    }

    public get graph$(): rx.Observable<Graph> {
        return this._graph$;
    }

    public node$(key: string): rx.Observable<Node> {
        return this._graph$.skipWhile((graph: Graph) => {
            let node: Node = graph.getNode(key);
            if (node == null || !node.worthy) {
                this._tilesService.cacheIm$.onNext(key);
                return true;
            }

            if (!node.cached) {
                this._cache$.onNext(node);
                return true;
            }

            return false;
        }).map((graph: Graph): Node => {
            return graph.getNode(key);
        }).take(1);
    }

    public nextNode$(node: Node, dir: number): rx.Observable<Node> {
        if (!node.cached) {
            rx.Observable.throw<Node>(new Error("node is not yet cached"));
        }

        return this._graph$.map((graph: Graph): string => {
            let nextNode: Node = graph.nextNode(node, dir);
            if (nextNode == null) {
                return null;
            }
            return nextNode.key;
        }).distinct().flatMap((key: string): rx.Observable<Node> => {
            if (key == null) {
                return null; // rx.Observable.throw<Node>(new Error("there is no node in that direction"));
            }
            return this.node$(key);
        });
    }
}

export default GraphService;
