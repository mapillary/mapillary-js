/// <reference path="../../typings/graphlib/graphlib.d.ts" />
/// <reference path="../../typings/rbush/rbush.d.ts" />

import * as graphlib from "graphlib";
import * as rbush from "rbush";

import {GraphConstants} from "../Graph";
import {ICalculatedEdges, EdgeCalculator} from "../Graph";
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
    private traversedKeys: any;

    constructor () {
        this.mapImageSequences = {};
        this.sequences = {};
        this.spatial = rbush(20000, [".lon", ".lat", ".lon", ".lat"]);
        this.graph = new graphlib.Graph();
        this.edgeCalculator = new EdgeCalculator();

        this.traversedCache = {};
        this.traversedDir = {};
        this.traversedKeys = {};
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

    public updateGraphForKey(key: string): void {
        this.traversedCache = {};
        this.traversedDir = {};

        let node: Node = this.node(key);

        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.NEXT, 2);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.PREV, 1);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.STEP_FORWARD, 2);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.STEP_BACKWARD, 1);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.STEP_LEFT, 0);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.STEP_RIGHT, 0);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.TURN_LEFT, 0);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.TURN_RIGHT, 0);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.TURN_U, 0);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.ROTATE_LEFT, 0);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.ROTATE_RIGHT, 1);
        this.traverseAndGenerateDir(node, GraphConstants.DirEnum.PANO, 1);
    }

    public keyIsWorthy(key: string): boolean {
        let node: Node = this.node(key);

        if (node == null) {
            return false;
        }

        return node.worthy;
    }

    public node (key: string): Node {
        let node: any = this.graph.node(key);
        return node;
    }

    private addCalculatedEdgesToNode(node: Node: edges: CalculatedEdges): void {
        console.log(node);
    }

    private traverseAndGenerateDir(node: Node, dir: GraphConstants.DirEnum, depth: number): void {
        if (node == null) {
            return;
        }
        if (depth < 0) {
            return;
        }
        if ((node.key in this.traversedDir) && this.traversedDir[node.key] === dir) {
            return;
        }
        if (!(node.key in this.traversedKeys)) {
            let edges: CalculatedEdges = this.edgeCalculator.calculateEdges(node);
            this.addCalculatedEdgesToNode(node, edges);
        }

        this.traversedCache[node.key] = true;
        this.traversedKeys[node.key] = true;
        this.traversedDir[node.key] = dir;

        // edges = @graph.outEdges(node.key)

        // for edge in edges
        //   edge = @graph.edge(edge)
        //   if edge.label == dir
        //     n = @graph.node(edge.to)
        //     if n.worthy
        //       traverseAndGenerateDir(n, dir, depth - 1)
    }
}

export default Graph;
