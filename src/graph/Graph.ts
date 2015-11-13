/// <reference path="../../typings/graphlib/graphlib.d.ts" />
/// <reference path="../../typings/rbush/rbush.d.ts" />

import * as graphlib from "graphlib";
import * as rbush from "rbush";
import * as _ from "underscore";

import {GraphConstants, ICalculatedEdges, EdgeCalculator} from "../Graph";
import {IAPINavIm, IAPINavImIm} from "../API";
import {ILatLon} from "../Viewer";
import {Node} from "./Node";
import {Sequence} from "./Sequence";

interface ISequences {
    [key: string]: Sequence;
}

export class Graph {
    public edgeCalculator: EdgeCalculator;

    private graph: any;
    private mapImageSequences: ISequences;
    private sequences: ISequences;
    private spatial: any;

    private traversedCache: any;
    private traversedDir: any;

    constructor () {
        this.mapImageSequences = {};
        this.sequences = {};
        this.spatial = rbush(20000, [".lon", ".lat", ".lon", ".lat"]);
        this.graph = new graphlib.Graph({multigraph: true});
        this.edgeCalculator = new EdgeCalculator();

        this.traversedCache = {};
        this.traversedDir = {};
    }

    public insertNodes (data: IAPINavIm): void {
        for (var i in data.ss) {
            if (data.ss.hasOwnProperty(i)) {
                let s: Sequence = new Sequence(data.ss[i]);
                for (var k in s.keys) {
                    if (s.keys.hasOwnProperty(k)) {
                        let key: string = s.keys[k];
                        this.mapImageSequences[key] = s;
                    }
                }
            }
        }

        for (var l in data.ims) {
            if (data.ims.hasOwnProperty(l)) {
                let im: IAPINavImIm = data.ims[l];
                if (!this.graph.hasNode(im.key) || !this.graph.node(im.key).worthy) {
                    if (this.graph.hasNode(im.key) && !this.graph.node(im.key).worthy) {
                        this.graph.delNode(im.key);
                    }

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

                    let node: Node = new Node(im.key, ca, latLon, true, this.mapImageSequences[im.key], im);

                    this.spatial.insert({node: node, lon: node.latLon.lon, lat: node.latLon.lat});
                    this.graph.setNode(node.key, node);
                }
            }
        }
    }

    public keyIsWorthy(key: string): boolean {
        let node: Node = this.node(key);

        if (node == null) {
            return false;
        }

        return node.worthy;
    }

    public nextNode(node: Node, dir: GraphConstants.DirEnum): Node {
        let outEdges: any[] = this.graph.outEdges(node.key);

        for (var i in outEdges) {
            if (outEdges.hasOwnProperty(i)) {
                let e: any = outEdges[i];
                if (this.graph.edge(e.v, e.w) === dir) {
                    return this.node(e.w);
                }
            }
        }

        return null;
    }

    public node(key: string): Node {
        return this.graph.node(key);
    }

    public updateGraph(node: Node): Node[] {
        this.traversedCache = {};
        this.traversedDir = {};

        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.NEXT, 2);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.PREV, 2);

        return _.map(this.traversedCache, (n: Node) => {
            return n;
        });
    }

    private addCalculatedEdgesToNode(node: Node, edges: ICalculatedEdges): void {
        let outEdges: any[] = this.graph.outEdges(node.key);

        for (var i in outEdges) {
            if (outEdges.hasOwnProperty(i)) {
                let e: any = outEdges[i];
                this.graph.removeEdge(e);
            }
        }

        for (var k in edges) {
            if (edges.hasOwnProperty(k)) {
                let es: any = edges[k];
                for (var l in es) {
                    if (es.hasOwnProperty(l)) {
                        let e: any = es[l];
                        this.graph.setEdge(node.key, e, parseInt(k, 10));
                    }
                }
            }
        }
    }

    private traverseAndGenerateDir(node: Node, dir: GraphConstants.DirEnum, depth: number): void {
        if (node === undefined || node == null) {
            return;
        }
        if (depth < 0) {
            return;
        }
        if ((node.key in this.traversedDir) && this.traversedDir[node.key] === dir) {
            return;
        }
        if (!(node.key in this.traversedCache)) {
            let edges: ICalculatedEdges = this.edgeCalculator.calculateEdges(node);
            this.addCalculatedEdgesToNode(node, edges);
        }

        this.traversedCache[node.key] = node;
        this.traversedDir[node.key] = dir;

        let outEdges: any[] = this.graph.outEdges(node.key);

        for (var i in outEdges) {
            if (outEdges.hasOwnProperty(i)) {
                let e: any = outEdges[i];
                if (this.graph.edge(e.v, e.w) === dir) {
                    if (this.node(e.w) !== undefined && this.node(e.w).worthy) {
                        this.traverseAndGenerateDir(this.node(e.w), dir, depth - 1);
                    } else if (this.node(e.w) === undefined) {
                        console.log("CREATE UNWORTHY NODE HERE");
                    }
                }
            }
        }
    }
}

export default Graph;
