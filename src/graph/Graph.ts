/// <reference path="../../typings/graphlib/graphlib.d.ts" />
/// <reference path="../../typings/rbush/rbush.d.ts" />

/* Interface Exports */
export * from "./interfaces/interfaces";

import {DirEnum} from "./GraphConstants";
import {EdgeCalculator} from "./EdgeCalculator";

import * as graphlib from "graphlib";
import * as rbush from "rbush";

/* Interfaces */
import {IAPINavIm, IAPINavImIm, IAPINavImS} from "../api/API";
import {ILatLon} from "../viewer/Viewer";
import {INode} from "./interfaces/interfaces";

interface ISequences {
    [key: string]: IAPINavImS;
}

export class Graph {
    private graph: any;
    private edgeCalculator: EdgeCalculator;
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
        this.edgeCalculator = new EdgeCalculator(this.graph);

        this.traversedCache = {};
        this.traversedDir = {};
        this.traversedKeys = {};

    }

    public insertNodes (data: IAPINavIm): void {
        for (var i in data.ss) {
            if (data.ss.hasOwnProperty(i)) {
                let s: IAPINavImS = data.ss[i];
                this.sequences[s.key] = s;
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

                    let node: INode = {
                        key: im.key,
                        ca: ca,
                        latLon: latLon,
                        worthy: true,
                        sequence: this.mapImageSequences[im.key],
                        apiNavImIm: im
                    };

                    this.spatial.insert({node: node, lon: node.latLon.lon, lat: node.latLon.lat});
                    this.graph.setNode(node.key, node);
                }
            }
        }
    }

    public updateGraphForKey(key: string): void {
        this.traversedCache = {};
        this.traversedDir = {};

        let node: INode = this.node(key);

        this.traverseAndGenerateDir(node, DirEnum.NEXT, 2);
        this.traverseAndGenerateDir(node, DirEnum.PREV, 1);
        this.traverseAndGenerateDir(node, DirEnum.STEP_FORWARD, 2);
        this.traverseAndGenerateDir(node, DirEnum.STEP_BACKWARD, 1);
        this.traverseAndGenerateDir(node, DirEnum.STEP_LEFT, 0);
        this.traverseAndGenerateDir(node, DirEnum.STEP_RIGHT, 0);
        this.traverseAndGenerateDir(node, DirEnum.TURN_LEFT, 0);
        this.traverseAndGenerateDir(node, DirEnum.TURN_RIGHT, 0);
        this.traverseAndGenerateDir(node, DirEnum.TURN_U, 0);
        this.traverseAndGenerateDir(node, DirEnum.ROTATE_LEFT, 0);
        this.traverseAndGenerateDir(node, DirEnum.ROTATE_RIGHT, 1);
        this.traverseAndGenerateDir(node, DirEnum.PANO, 1);
    }

    public keyIsWorthy(key: string): boolean {
        let node: INode = this.node(key);

        if (node == null) {
            return false;
        }

        return node.worthy;
    }

    public node (key: string): INode {
        let node: any = this.graph.node(key);
        return node;
    }

    private traverseAndGenerateDir(node: INode, dir: DirEnum, depth: number): void {
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
            this.edgeCalculator.updateEdges(this.mapImageSequences[node.key], node);
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
