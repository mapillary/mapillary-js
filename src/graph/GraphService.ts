/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IAPINavIm} from "../API";
import {Graph, Node, TilesService} from "../Graph";

interface IGraphOperation extends Function {
  (graph: Graph): Graph;
}

export class GraphService {
    public updates: rx.Subject<any> = new rx.Subject<any>();

    public cache: rx.Subject<any> = new rx.Subject<any>();
    public cachedNode: rx.Observable<Node>;

    public graph: rx.Observable<Graph>;

    public tilesService: TilesService;

    constructor (clientId: string) {
        this.tilesService = new TilesService(clientId);

        // operation pattern updating the graph
        this.graph = this.updates
            .scan<Graph>(
            (graph: Graph, operation: IGraphOperation): Graph => {
                let newGraph: Graph = operation(graph);
                newGraph.evictNodeCache();
                return newGraph;
            },
            new Graph())
            .shareReplay(1);

        // always keep the graph running also initiate it to empty
        this.graph.subscribe();
        this.updates.onNext((graph: Graph): Graph => {
            return graph;
        });

        // stream of cached nodes, uses distinct to not cache a node more than once
        this.cachedNode = this.cache.distinct((node: Node): string => {
            return node.key + node.lastCacheEvict;
        }).flatMap<Node>((node: Node): rx.Observable<Node> => {
            return node.cacheAssets();
        });

        // make tilesservice aware of that a new node is beeing cached
        this.cachedNode.subscribe(this.tilesService.cacheNode);

        // save the cached node to the graph, cache its edges
        this.cachedNode.map((node: Node) => {
            return (graph: Graph): Graph => {
                graph.cacheNode(node);
                return graph;
            };
        }).subscribe(this.updates);

        // feedback from tiles service adding fresh tiles to the graph
        this.tilesService.tiles.map((data: IAPINavIm): IGraphOperation => {
            return (graph: Graph): Graph => {
                graph.addNodesFromAPI(data);
                return graph;
            };
        }).subscribe(this.updates);
    }

    public getNode(key: string): rx.Observable<Node> {
        return this.graph.skipWhile((graph: Graph) => {
            let node: Node = graph.getNode(key);
            if (node == null || !node.worthy) {
                this.tilesService.cacheIm.onNext(key);
                return true;
            }

            if (!node.cached) {
                this.cache.onNext(node);
                return true;
            }

            return false;
        }).map((graph: Graph): Node => {
            return graph.getNode(key);
        }).take(1);
    }

    public getNextNode(node: Node, dir: number): rx.Observable<Node> {
        if (!node.cached) {
            rx.Observable.throw<Node>(new Error("node is not yet cached"));
        }

        return this.graph.map((graph: Graph): string => {
            let nextNode: Node = graph.nextNode(node, dir);
            if (nextNode == null) {
                return null;
            }
            return nextNode.key;
        }).distinct().flatMap((key: string): rx.Observable<Node> => {
            if (key == null) {
                return null; // rx.Observable.throw<Node>(new Error("there is no node in that direction"));
            }
            return this.getNode(key);
        });
    }
}

export default GraphService;
