/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/graphlib/graphlib.d.ts" />
/// <reference path="../../typings/rbush/rbush.d.ts" />

import * as _ from "underscore";
import * as graphlib from "graphlib";
import * as rbush from "rbush";
import * as rx from "rx";

import {IAPINavIm, IAPINavImS, IAPINavImIm} from "../API";
import {IEdge, IPotentialEdge, IEdgeData, EdgeCalculator, EdgeConstants} from "../Edge";
import {ILatLon, ILatLonAlt, Node, Sequence, TilesService} from "../Graph";
import {Spatial, GeoCoords} from "../Geo";

export class MyGraph {
    public referenceLatLonAlt: ILatLonAlt = null;

    private edgeCalculator: EdgeCalculator;

    private sequences: Sequence[];
    private sequenceHash: {[key: string]: Sequence};

    private graph: any;
    private spatial: any;

    private boxWidth: number = 0.001;
    private defaultAlt: number = 2;

    private spatialLib: Spatial;
    private geoCoords: GeoCoords;

    constructor () {
        this.sequences = [];
        this.sequenceHash = {};
        this.spatial = rbush(20000, [".lon", ".lat", ".lon", ".lat"]);
        this.graph = new graphlib.Graph({multigraph: true});
        this.edgeCalculator = new EdgeCalculator();
        this.spatialLib = new Spatial();
        this.geoCoords = new GeoCoords();
    }

    public getNode(key: string): Node {
        return this.graph.node(key);
    }

    public getEdges(node: Node): IEdge[] {
        let outEdges: any[] = this.graph.outEdges(node.key);

        return _.map(outEdges, (outEdge: any) => {
            let edge: any = this.graph.edge(outEdge);

            return {
                from: outEdge.v,
                to: outEdge.w,
                data: <IEdgeData>edge
            };
        });
    }

    public computeEdges(node: Node): boolean {
        if (!node.worthy) {
            return false;
        }

        let edges: IEdge[] = this.edgeCalculator.computeSequenceEdges(node);
        let fallbackKeys: string[] = _.map(edges, (edge: IEdge) => { return edge.to; });

        let minLon: number = node.latLon.lon - this.boxWidth / 2;
        let minLat: number = node.latLon.lat - this.boxWidth / 2;

        let maxLon: number = node.latLon.lon + this.boxWidth / 2;
        let maxLat: number = node.latLon.lat + this.boxWidth / 2;

        let nodes: Node[] = _.map(this.spatial.search([minLon, minLat, maxLon, maxLat]), (item: any) => {
            return <Node>item.node;
        });

        let potentialEdges: IPotentialEdge[] = this.edgeCalculator.getPotentialEdges(node, nodes, fallbackKeys);

        edges = edges.concat(
            this.edgeCalculator.computeStepEdges(
                node,
                potentialEdges,
                node.findPrevKeyInSequence(),
                node.findNextKeyInSequence()));

        this.addEdgesToNode(node, edges);

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

    public computeTranslation(im: IAPINavImIm, latLon: ILatLon): number[] {
        let alt: number = im.calt == null ? this.defaultAlt : im.calt;

        if (this.referenceLatLonAlt == null) {
            this.referenceLatLonAlt = {
                alt: alt,
                lat: latLon.lat,
                lon: latLon.lon
            };
        }

        let C: number[] = this.geoCoords.topocentric_from_lla(
            latLon.lat,
            latLon.lon,
            alt,
            this.referenceLatLonAlt.lat,
            this.referenceLatLonAlt.lon,
            this.referenceLatLonAlt.alt);

        let RC: THREE.Vector3 = this.spatialLib.rotate(C, im.rotation);

        return [-RC.x, -RC.y, -RC.z];
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
    public updates: rx.Subject<any> = new rx.Subject<any>();

    public cache: rx.Subject<any> = new rx.Subject<any>();
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

        this.cachedNode = this.cache.distinct((node: Node): string => {
            return node.key;
        }).flatMap<Node>((node: Node): rx.Observable<Node> => {
            return node.cacheAssets();
        });
        this.cachedNode.subscribe(this.tilesService.cacheNode);

        this.cachedNode.map((node: Node) => {
            return (myGraph: MyGraph): MyGraph => {
                myGraph.computeEdges(node);
                node.cached = true;
                return myGraph;
            };
        }).subscribe(this.updates);

        this.tilesService.tiles.map((data: IAPINavIm): IGraphOperation => {
            return (myGraph: MyGraph): MyGraph => {
                if (data === undefined) {
                    return myGraph;
                }

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

                    let translation: number[] = myGraph.computeTranslation(im, latLon);

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
