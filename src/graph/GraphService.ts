/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IAPINavIm} from "../API";
import {MyGraph, Node, TilesService} from "../Graph";

interface IGraphOperation extends Function {
  (myGraph: MyGraph): MyGraph;
}

export class GraphService {
    public updates: rx.Subject<any> = new rx.Subject<any>();

    public cache: rx.Subject<any> = new rx.Subject<any>();
    public cachedNode: rx.Observable<Node>;

    public graph: rx.Observable<MyGraph>;

    public tilesService: TilesService;

    private prisitine: boolean;

    constructor (clientId: string) {
        this.prisitine = true;
        this.tilesService = new TilesService(clientId);

        // operation pattern updating the graph
        this.graph = this.updates
            .scan<MyGraph>(
            (myGraph: MyGraph, operation: IGraphOperation): MyGraph => {
                let newMyGraph: MyGraph = operation(myGraph);
                newMyGraph.evictNodeCache();
                return newMyGraph;
            },
            new MyGraph())
            .shareReplay(1);

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
            return (myGraph: MyGraph): MyGraph => {
                myGraph.cacheNode(node);
                return myGraph;
            };
        }).subscribe(this.updates);

        // feedback from tiles service adding fresh tiles to the graph
        this.tilesService.tiles.map((data: IAPINavIm): IGraphOperation => {
            return (myGraph: MyGraph): MyGraph => {
                myGraph.addNodesFromAPI(data);
                return myGraph;
            };
        }).subscribe(this.updates);
    }

    public getNode(key: string, cacheEdges: boolean = true): rx.Observable<Node> {
        let ret: rx.Observable<Node> = this.graph.skipWhile((myGraph: MyGraph) => {
            let node: Node = myGraph.getNode(key);
            if (node == null || !node.worthy) {
                this.tilesService.cacheIm.onNext(key);
                return true;
            }

            if (!node.cached) {
                this.cache.onNext(node);
                return true;
            }

            return false;
        }).map((myGraph: MyGraph): Node => {
            return myGraph.getNode(key);
        });

        // hack to start of the whole graph fetching process, a better trigger is needed
        if (this.prisitine) {
            this.tilesService.cacheIm.onNext(key);
            this.prisitine = false;
        }

        return ret;
    }

    public getNextNode(node: Node, dir: number): rx.Observable<Node> {
        if (!node.cached) {
            rx.Observable.throw<Node>(new Error("node is not yet cached"));
        }

        // go find the next node
        return this.graph.map((myGraph: MyGraph): string => {
            let nextNode: Node = myGraph.nextNode(node, dir);
            if (nextNode == null) {
                return null;
            }
            return nextNode.key;
        }).distinct().flatMap((key: string): rx.Observable<Node> => {
            if (key == null) {
                return rx.Observable.throw<Node>(new Error("there is no node in that direction"));
            }
            return this.getNode(key);
        });
    }
}

export default GraphService;
