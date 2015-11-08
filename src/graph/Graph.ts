/// <reference path="../../typings/graphlib/graphlib.d.ts" />
/// <reference path="../../typings/rbush/rbush.d.ts" />

/* Interface Exports */
export * from "./interfaces/interfaces"

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
    private mapImageSequences: ISequences;
    private sequences: ISequences;
    private spatial: any;

    constructor () {
        this.mapImageSequences = {};
        this.sequences = {};
        this.spatial = rbush(20000, [".lon", ".lat", ".lon", ".lat"]);
        this.graph = new graphlib.Graph();
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
}

export default Graph;
