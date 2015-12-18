/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/graphlib/graphlib.d.ts" />
/// <reference path="../../typings/rbush/rbush.d.ts" />

import * as _ from "underscore";
import * as graphlib from "graphlib";
import * as rbush from "rbush";
import * as rx from "rx";

import {IAPINavIm, IAPINavImS, IAPINavImIm} from "../API";
import {IAPIVal, ILatLon, Node, Sequence, TilesService} from "../Graph";

export class MyGraph {
    public sequences: Sequence[];
    public sequenceHash: {[key: string]: Sequence};

    private graph: any;
    private spatial: any;

    constructor () {
        this.sequences = [];
        this.sequenceHash = {};
        this.spatial = rbush(20000, [".lon", ".lat", ".lon", ".lat"]);
        this.graph = new graphlib.Graph({multigraph: true});
    }

    public getNode(key: string): Node {
        return this.graph.node(key);
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
}

interface IGraphOperation extends Function {
  (myGraph: MyGraph): MyGraph;
}

export class GraphService {
    public graph: rx.Observable<MyGraph>;
    public updates: rx.Subject<any> = new rx.Subject<any>();

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

        this.tilesService.imTiles.merge(this.tilesService.hTiles).map((val: IAPIVal): IGraphOperation => {
            return (myGraph: MyGraph): MyGraph => {
                let data: IAPINavIm = val.data;
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

    public getNode(key: string): rx.Observable<Node> {
        let ret: rx.Observable<Node> = this.graph.skipWhile((myGraph: MyGraph) => {
            let node: Node = myGraph.getNode(key);
            if (node == null || node === undefined) {
                return true;
            } else {
                if (!node.worthy) {
                    return true;
                }
                if (!node.edgesSynched) {
                    return false;
                }

                return false;
            }
        }).map((myGraph: MyGraph): Node => {
            return myGraph.getNode(key);
        }).first();

        if (this.prisitine) {
            this.tilesService.cacheIm.onNext(key);
            this.prisitine = false;
        }

        return ret;
    }

    public getNextNode(key: string, dir: number): rx.Observable<Node> {
        let ret: rx.Observable<Node> = this.graph.skipWhile((myGraph: MyGraph) => {
            let node: Node = myGraph.getNode(key);
            return (node == null || node === undefined);
        }).map((myGraph: MyGraph): Node => {
            return myGraph.getNode(key);
        }).first();

        this.tilesService.cacheIm.onNext(key);

        return ret;
    }
}

export default GraphService;
