/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {IAPINavIm} from "../API";
import {MyGraph, Node, TilesService} from "../Graph";
import {IEdge} from "../Edge";

interface IGraphOperation extends Function {
  (myGraph: MyGraph): MyGraph;
}

export class GraphService {
    public updates: rx.Subject<any> = new rx.Subject<any>();

    public cache: rx.Subject<any> = new rx.Subject<any>();
    public cachedNode: rx.Observable<Node>;

    public graph: rx.Observable<MyGraph>;

    public tilesService: TilesService;

    constructor (clientId: string) {
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

        // always keep the graph running also initiate it to empty
        this.graph.subscribe();
        this.updates.onNext((myGraph: MyGraph): MyGraph => {
            return myGraph;
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

            if (cacheEdges) {
                _.map(node.edges, (edge: IEdge) => {
                    this.getNode(edge.to, false).first().subscribe();
                });
            }

            return false;
        }).map((myGraph: MyGraph): Node => {
            return myGraph.getNode(key);
        });

        return ret;
    }

    public getNextNode(node: Node, dir: number): rx.Observable<Node> {
        if (!node.cached) {
            rx.Observable.throw<Node>(new Error("node is not yet cached"));
        }

        return this.graph.map((myGraph: MyGraph): string => {
            let nextNode: Node = myGraph.nextNode(node, dir);
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
