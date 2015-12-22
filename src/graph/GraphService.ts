/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/graphlib/graphlib.d.ts" />
/// <reference path="../../typings/rbush/rbush.d.ts" />

import * as _ from "underscore";
import * as graphlib from "graphlib";
import * as rbush from "rbush";
import * as rx from "rx";

import {IAPINavIm, IAPINavImS, IAPINavImIm} from "../API";
import {IEdge, EdgeCalculator, EdgeConstants} from "../Edge";
import {ILatLon, Node, Sequence, TilesService} from "../Graph";

export class MyGraph {
    private edgeCalculator: EdgeCalculator;

    private sequences: Sequence[];
    private sequenceHash: {[key: string]: Sequence};

    private graph: any;
    private spatial: any;

    constructor () {
        this.sequences = [];
        this.sequenceHash = {};
        this.spatial = rbush(20000, [".lon", ".lat", ".lon", ".lat"]);
        this.graph = new graphlib.Graph({multigraph: true});
        this.edgeCalculator = new EdgeCalculator();
    }

    public getNode(key: string): Node {
        return this.graph.node(key);
    }

    public getEdges(node: Node): IEdge[] {
        let outEdges: any[] = this.graph.outEdges(node.key);
        return outEdges;
    }

    public computeEdges(node: Node): boolean {
        if (!node.worthy) {
            return false;
        }

        let edges: IEdge[] = this.edgeCalculator.computeSequenceEdges(node);
        this.addEdgesToNode(node, edges);

        node.edgesSynched = true;
        return true;
    }

    public insertNodes(nodes: Node[]): void {
        _.each(nodes, (node: Node) => {
            this.insertNode(node);
        });
    }

    public insertSequences(sequences: Sequence[]): void {
        this.sequences = _.uniq(this.sequences.concat(sequences), (sequence: Sequence): string => {
            return sequence.key;
        });
    }

    public insertNode(node: Node): void {
        this.spatial.insert({node: node, lon: node.latLon.lon, lat: node.latLon.lat});
        this.graph.setNode(node.key, node);
    }

    public nextNode(node: Node, dir: EdgeConstants.Direction): Node {
        let outEdges: any[] = this.graph.outEdges(node.key);

        for (let i: number = 0; i < outEdges.length; i++) {
            let outEdge: any = outEdges[i];

            let edge: any = this.graph.edge(outEdge);

            if (edge.direction === dir) {
                return this.getNode(outEdge.w);
            }
        }

        return null;
    }

    private addEdgesToNode(node: Node, edges: IEdge[]): void {
        let outEdges: any[] = this.graph.outEdges(node.key);

        for (let i in outEdges) {
            if (outEdges.hasOwnProperty(i)) {
                let e: any = outEdges[i];
                this.graph.removeEdge(e);
            }
        }

        for (let i: number = 0; i < edges.length; i++) {
            let edge: IEdge = edges[i];

            this.graph.setEdge(node.key, edge.to, edge.data, node.key + edge.to + edge.data.direction);
        }
    }

}

interface IGraphOperation extends Function {
  (myGraph: MyGraph): MyGraph;
}

export class GraphService {
    public cache: rx.Subject<any> = new rx.Subject<any>();
    public getedges: rx.Subject<any> = new rx.Subject<any>();
    public updates: rx.Subject<any> = new rx.Subject<any>();

    public cachedNode: rx.Observable<Node>;

    public graph: rx.Observable<MyGraph>;

    public tilesService: TilesService;

    private prisitine: boolean;

    constructor (clientId: string) {
        this.prisitine = true;
        this.tilesService = new TilesService(clientId);

        this.graph = this.updates
            .scan<MyGraph>(
            (myGraph: MyGraph, operation: IGraphOperation): MyGraph => {
                return operation(myGraph);
            },
            new MyGraph())
            .shareReplay(1);

        this.getedges.map((node: Node) => {
            return (myGraph: MyGraph): MyGraph => {
                myGraph.computeEdges(node);
                return myGraph;
            };
        }).subscribe(this.updates);

        this.cachedNode = this.cache.flatMap<Node>((node: Node): rx.Observable<Node> => {
            return node.cacheAssets();
        });
        this.cachedNode.subscribe(this.tilesService.cacheNode);

        this.cachedNode.map((node: Node) => {
            return (myGraph: MyGraph): MyGraph => {
                node.cached = true;
                return myGraph;
            };
        }).subscribe(this.updates);

        this.tilesService.imTiles.merge(this.tilesService.hTiles).map((data: IAPINavIm): IGraphOperation => {
            return (myGraph: MyGraph): MyGraph => {
                let nodes: Node[];
                let sequences: Sequence[];
                let sequenceHash: {[key: string]: Sequence} = {};

                sequences = _.map(data.ss, (sData: IAPINavImS): Sequence => {
                    let sequence: Sequence = new Sequence(sData);

                    _.each(sData.keys, (key: string): void => {
                        sequenceHash[key] = sequence;
                    });

                    return sequence;
                });

                nodes = _.map(data.ims, (im: IAPINavImIm): Node => {
                    let lat: number = im.lat;
                    if (im.clat != null) {
                         lat = im.clat;
                    }
                    let lon: number = im.lon;
                    if (im.clon != null) {
                        lon = im.clon;
                    }
                    let ca: number = im.ca;
                    if (im.cca != null) {
                        ca = im.cca;
                    }

                    let latLon: ILatLon = {lat: lat, lon: lon};
                    let translation: number[] = [0, 0, 0];

                    let node: Node = new Node(
                        im.key,
                        ca,
                        latLon,
                        true,
                        sequenceHash[im.key],
                        im,
                        translation
                    );

                    return node;
                });

                myGraph.insertNodes(nodes);
                myGraph.insertSequences(sequences);

                return myGraph;
            };
        }).subscribe(this.updates);
    }

    public getNode(key: string, cacheEdges: boolean = true): rx.Observable<Node> {
        let ret: rx.Observable<Node> = this.graph.skipWhile((myGraph: MyGraph) => {
            let node: Node = myGraph.getNode(key);
            if (node == null || node === undefined) {
                this.tilesService.cache(key);
                return true;
            } else {
                if (!node.worthy) {
                    this.tilesService.cache(node.key);
                    return true;
                }
                if (!node.synchingEdges) {
                    this.synchEdges(node);
                }
                if (!node.caching) {
                    this.cacheNode(node);
                }

                if (node.edgesSynched && cacheEdges) {
                    let nextNode: Node = myGraph.nextNode(node, EdgeConstants.Direction.NEXT);
                    if (nextNode != null) {
                        this.getNode(nextNode.key, false).first().subscribe();
                    }

                    nextNode = myGraph.nextNode(node, EdgeConstants.Direction.PREV);
                    if (nextNode != null) {
                        this.getNode(nextNode.key, false).first().subscribe();
                    }
                }

                return !node.edgesSynched || !node.cached;
            }
        }).map((myGraph: MyGraph): Node => {
            return myGraph.getNode(key);
        });

        if (this.prisitine) {
            this.tilesService.cache(key);
            this.prisitine = false;
        }

        return ret;
    }

    public getNextNode(node: Node, dir: number): rx.Observable<Node> {
        if (!node.edgesSynched || !node.cached) {
            rx.Observable.throw<Node>(new Error("node is not yet cached"));
        }

        return this.graph.map((myGraph: MyGraph): Node => {
            return myGraph.nextNode(node, dir);
        }).flatMap((nextNode: Node): rx.Observable<Node> => {
            if (nextNode == null) {
                return rx.Observable.throw<Node>(new Error("there is no node in that direction"));
            } else {
                return this.getNode(nextNode.key);
            }
        });
    }

    public synchEdges(node: Node): void {
        node.synchingEdges = true;
        this.getedges.onNext(node);
    }

    public cacheNode(node: Node): void {
        node.caching = true;
        this.cache.onNext(node);
    }
}

export default GraphService;
