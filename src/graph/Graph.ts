/// <reference path="../../typings/graphlib/graphlib.d.ts" />
/// <reference path="../../typings/rbush/rbush.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="../../typings/latlon-geohash/latlon-geohash.d.ts" />

import * as _ from "underscore";
import * as graphlib from "graphlib";
import * as rbush from "rbush";
import * as THREE from "three";
import * as geohash from "latlon-geohash";

import {IAPINavIm, IAPINavImS, IAPINavImIm} from "../API";
import {IEdge, IPotentialEdge, IEdgeData, EdgeCalculator, EdgeDirection} from "../Edge";
import {Spatial, GeoCoords} from "../Geo";
import {ILatLon, ILatLonAlt, Node, Sequence} from "../Graph";

class GeoHashDirections {
    public static n: string = "n";
    public static nw: string = "nw";
    public static w: string = "w";
    public static sw: string = "sw";
    public static s: string = "s";
    public static se: string = "se";
    public static e: string = "e";
    public static ne: string = "ne";
}

export class Graph {
    public referenceLatLonAlt: ILatLonAlt = null;

    private edgeCalculator: EdgeCalculator;

    private sequences: Sequence[];
    private sequenceHash: {[key: string]: Sequence};

    private graph: any;
    private spatial: any;

    private cachedNodes: {[key: string]: boolean};
    private unWorthyNodes: {[key: string]: boolean};

    private boxWidth: number = 0.001;
    private defaultAlt: number = 2;

    private spatialLib: Spatial;
    private geoCoords: GeoCoords;

    /**
     * Creates a graph instance
     * @class Graph
     */
    constructor () {
        this.sequences = [];
        this.sequenceHash = {};
        this.spatial = rbush(20000, [".lon", ".lat", ".lon", ".lat"]);
        this.graph = new graphlib.Graph({multigraph: true});
        this.cachedNodes = {};
        this.unWorthyNodes = {};
        this.edgeCalculator = new EdgeCalculator();
        this.spatialLib = new Spatial();
        this.geoCoords = new GeoCoords();
    }

    /**
     * Add nodes from an API call
     * @param {IAPINavIm} data - todo
     */
    public addNodesFromAPI(data: IAPINavIm, tiles: {[key: string]: boolean}): void {
        if (data === undefined) {
            return;
        }

        let h: string = data.hs[0];
        let bounds: geohash.IBounds = geohash.bounds(h);
        let neighbours: { [key: string]: string } = geohash.neighbours(h);

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

            if (im.rotation == null) {
                im.rotation = this.computeRotation(im.ca, im.orientation);
            }

            let translation: number[] = this.computeTranslation(im, latLon);

            let hs: string[] = this.computeHs(latLon, bounds.sw, bounds.ne, h, neighbours);

            let node: Node = new Node(
                im.key,
                ca,
                latLon,
                false,
                sequenceHash[im.key],
                im,
                translation,
                hs
            );

            node.user = im.user;
            node.capturedAt = im.captured_at;

            this.unWorthyNodes[im.key] = true;

            return node;
        });

        this.insertNodes(nodes);
        this.insertSequences(sequences);
        this.makeNodesWorthy(tiles);
    }

    public makeNodesWorthy(tiles: {[key: string]: boolean}): void {
        let worthy: boolean;
        let worthyKeys: string[] = [];
        for (let key in this.unWorthyNodes) {
            if (!this.unWorthyNodes.hasOwnProperty(key)) {
                continue;
            }

            if (!this.unWorthyNodes[key]) {
                worthyKeys.push(key);
                continue;
            }

            let node: Node = this.getNode(key);
            let hs: string[] = node.hs;

            worthy = true;
            _.each(hs, (h: string): void => {
                worthy = worthy && !!tiles[h];
            });

            if (worthy) {
                node.worthy = true;
                this.unWorthyNodes[key] = false;
                worthyKeys.push(key);
            }
        }

        for (let key of worthyKeys) {
            delete this.unWorthyNodes[key];
        }
    }

    /**
     * Get node from valid `key`
     * @param {string} key - valid Mapillary photo key
     * @return {Node}
     */
    public getNode(key: string): Node {
        return this.graph.node(key);
    }

    /**
     * Get edges for the given node
     * @param {Node} node - The node
     * @return {IEdge}
     */
    public getEdges(node: Node): IEdge[] {
        let outEdges: any[] = this.graph.outEdges(node.key);

        return _.map(outEdges, (outEdge: any) => {
            let edge: any = this.graph.edge(outEdge);

            return {
                data: <IEdgeData>edge,
                from: outEdge.v,
                to: outEdge.w,
            };
        });
    }

    /**
     * Cache given node
     * @param {Node} node - Node to be cached
     */
    public cacheNode(node: Node): void {
        this.computeEdges(node);
        node.cached = true;
        node.lastUsed =  new Date().getTime();
        this.cachedNodes[node.key] = true;
    }

    /**
     * Clear node cache
     */
    public evictNodeCache(): void {
        if (Object.keys(this.cachedNodes).length < 30) {
            // no cleaning of cache
            return;
        }
        // evice nodes from cache here
        return;
    }

    /**
     * Clear cache for the given node
     * @param {Node} node - Node which cache will be cleared
     */
    public unCacheNode(node: Node): void {
        delete this.cachedNodes[node.key];
        node.lastCacheEvict = new Date().getTime();
    }

    /**
     * Compute edges for the given node
     * @param {Node} node
     * @return {boolean}
     */
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

        edges = edges.concat(this.edgeCalculator.computeTurnEdges(node, potentialEdges));
        edges = edges.concat(this.edgeCalculator.computePanoEdges(node, potentialEdges));
        edges = edges.concat(this.edgeCalculator.computePerspectiveToPanoEdges(node, potentialEdges));

        this.addEdgesToNode(node, edges);

        node.edges = this.getEdges(node);

        return true;
    }

    /**
     * Insert given nodes
     * @param {Node[]}
     */
    public insertNodes(nodes: Node[]): void {
        _.each(nodes, (node: Node) => {
            this.insertNode(node);
        });
    }

    /**
     * Insert given sequences
     * @param {Sequence[]}
     */
    public insertSequences(sequences: Sequence[]): void {
        this.sequences = _.uniq(this.sequences.concat(sequences), (sequence: Sequence): string => {
            return sequence.key;
        });
    }

    /**
     * Insert node
     * @param {Node} node
     */
    public insertNode(node: Node): void {
        if (this.getNode(node.key) != null) {
            return;
        }
        this.spatial.insert({lat: node.latLon.lat, lon: node.latLon.lon, node: node});
        this.graph.setNode(node.key, node);
    }

    /**
     * Find next node in the graph
     * @param {Node} node
     * @param {Direction} dir
     * @return {Node}
     */
    public nextNode(node: Node, dir: EdgeDirection): Node {
        let outEdges: any[] = this.graph.outEdges(node.key);

        for (let outEdge of outEdges) {
            let edge: any = this.graph.edge(outEdge);

            if (edge.direction === dir) {
                return this.getNode(outEdge.w);
            }
        }

        return null;
    }

    private computeHs(
        latLon: ILatLon,
        sw: ILatLon,
        ne: ILatLon,
        h: string,
        neighbours: { [key: string]: string }): string[] {

        let hs: string[] = [h];

        let bl: number[] = [0, 0, 0];
        let tr: number[] =
            this.geoCoords.topocentric_from_lla(
                ne.lat,
                ne.lon,
                0,
                sw.lat,
                sw.lon,
                0);

        let position: number[] =
            this.geoCoords.topocentric_from_lla(
                latLon.lat,
                latLon.lon,
                0,
                sw.lat,
                sw.lon,
                0);

        let left: number = position[0] - bl[0];
        let right: number = tr[0] - position[0];
        let bottom: number = position[1] - bl[1];
        let top: number = tr[1] - position[1];

        let l: boolean = left < 20;
        let r: boolean = right < 20;
        let b: boolean = bottom < 20;
        let t: boolean = top < 20;

        if (t) {
            hs.push(neighbours[GeoHashDirections.n]);
        }

        if (t && l) {
            hs.push(neighbours[GeoHashDirections.nw]);
        }

        if (l) {
            hs.push(neighbours[GeoHashDirections.w]);
        }

        if (l && b) {
            hs.push(neighbours[GeoHashDirections.sw]);
        }

        if (b) {
            hs.push(neighbours[GeoHashDirections.s]);
        }

        if (b && r) {
            hs.push(neighbours[GeoHashDirections.se]);
        }

        if (r) {
            hs.push(neighbours[GeoHashDirections.e]);
        }

        if (r && t) {
            hs.push(neighbours[GeoHashDirections.ne]);
        }

        return hs;
    }

    /**
     * Compute rotation
     * @param {number} compassAngle
     * @return {Array<number>}
     */
    private computeRotation(compassAngle: number, orientation: number): number[] {
        let x: number = 0;
        let y: number = 0;
        let z: number = 0;

        switch (orientation) {
            case 1:
                x = Math.PI / 2;
                break;
            case 3:
                x = -Math.PI / 2;
                z = Math.PI;
                break;
            case 6:
                y = -Math.PI / 2;
                z = -Math.PI / 2;
                break;
            case 8:
                y = Math.PI / 2;
                z = Math.PI / 2;
                break;
            default:
                break;
        }

        let rz: THREE.Matrix4 = new THREE.Matrix4().makeRotationZ(z);
        let euler: THREE.Euler = new THREE.Euler(x, y, compassAngle * Math.PI / 180, "XYZ");
        let re: THREE.Matrix4 = new THREE.Matrix4().makeRotationFromEuler(euler);

        let rotation: THREE.Vector4 = new THREE.Vector4().setAxisAngleFromRotationMatrix(re.multiply(rz));

        return rotation.multiplyScalar(rotation.w).toArray().slice(0, 3);
    }

    /**
     * Compute translation
     * @param {IAPINavImIm} im
     * @param {ILatLon} latLon
     * @return {number}
     */
    private computeTranslation(im: IAPINavImIm, latLon: ILatLon): number[] {
        let alt: number = im.calt == null ? this.defaultAlt : im.calt;

        if (this.referenceLatLonAlt == null) {
            this.referenceLatLonAlt = {
                alt: alt,
                lat: latLon.lat,
                lon: latLon.lon,
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

    /**
     * Add edges to given node
     * @param {Node} node
     * @param {IEdge[]} edges
     */
    private addEdgesToNode(node: Node, edges: IEdge[]): void {
        let outEdges: any[] = this.graph.outEdges(node.key);

        for (let i in outEdges) {
            if (outEdges.hasOwnProperty(i)) {
                let e: any = outEdges[i];
                this.graph.removeEdge(e);
            }
        }

        for (let edge of edges) {
            this.graph.setEdge(node.key, edge.to, edge.data, node.key + edge.to + edge.data.direction);
        }
    }

}

export default Graph;
