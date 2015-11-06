/// <reference path="../typings/graphlib/graphlib.d.ts" />

import * as graphlib from "graphlib";

/* Interfaces */
import IAPINavIm from "./interfaces/IAPINavIm";
import IAPINavImIm from "./interfaces/IAPINavImIm";
import IAPINavImS from "./interfaces/IAPINavImS";
// import INode from "./interfaces/INode";

interface ISequences {
    [key: string]: IAPINavImS;
}

export class Graph {
    private graph: any;
    private mapImageSequences: ISequences;
    private sequences: ISequences;

    constructor () {
        this.mapImageSequences = {};
        this.sequences = {};
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

                    if (im.clat != null) {
                        im.old_lat = im.lat;
                        im.lat = im.clat;
                    }

                    if (im.clon != null) {
                        im.old_lon = im.lon;
                        im.lon = im.clon;
                    }

                    if (im.cca != null) {
                        im.old_ca = im.ca;
                        im.ca = im.cca;
                    }

                    im.worthy = true;
                    im.sequence = this.mapImageSequences[im.key];

                    this.graph.setNode(im.key, im);
                }
            }
        }
    }

    public node (key: string): any {
        let node: any = this.graph.node(key);
        return node;
    }
}

export default Graph;
