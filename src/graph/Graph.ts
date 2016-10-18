/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/from";

import "rxjs/add/operator/catch";
import "rxjs/add/operator/do";
import "rxjs/add/operator/finally";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/publish";

import * as _ from "underscore";
import * as graphlib from "graphlib";
import * as rbush from "rbush";
import * as THREE from "three";
import * as geohash from "latlon-geohash";

import {APIv3, IAPINavIm, IAPINavImIm, ICoreNode, IFillNode, IFullNode, ISequence} from "../API";
import {IEdge, IPotentialEdge, IEdgeData, EdgeCalculator, EdgeDirection} from "../Edge";
import {Spatial, GeoCoords, ILatLon} from "../Geo";
import {NewNode, NewNodeCache, Node, Sequence, GraphCalculator} from "../Graph";

type INewSpatialItem = {
    lat: number;
    lon: number;
    node: NewNode;
}

type NodeTiles = {
    cache: string[];
    caching: string[];
}

type SpatialNodes = {
    all: { [key: string]: NewNode };
    cacheKeys: string[];
    cacheNodes: { [key: string]: NewNode };
}

export class NewGraph {
    private _apiV3: APIv3;
    private _sequences: { [skey: string]: Sequence };
    private _nodeCache: { [key: string]: NewNode };
    private _tileNodeCache: { [key: string]: boolean };
    private _spatialNodeCache: { [key: string]: NewNode };
    private _preTileStore: { [key: string]:  { [key: string]: NewNode }; };
    private _tileCache: { [key: string]: NewNode[] };
    private _tilePrecision: number;
    private _tileThreshold: number;
    private _nodeIndex: rbush.RBush<INewSpatialItem>;
    private _nodes: { [key: string]: NewNode };
    private _graphCalculator: GraphCalculator;
    private _edgeCalculator: EdgeCalculator;
    private _defaultAlt: number;

    private _fetching: { [key: string]: Observable<NewGraph> };
    private _filling: { [key: string]: Observable<NewGraph> };
    private _cachingSequence: { [key: string]: Observable<NewGraph> };
    private _nodeTiles: { [key: string]: NodeTiles };
    private _cachingTile: { [h: string]: Observable<NewGraph> };
    private _spatialNodes: { [key: string]: SpatialNodes };
    private _cachingSpatialNodes: { [key: string]: Observable<NewGraph>[] };

    private _changed$: Subject<NewGraph>;

    constructor(
        apiV3: APIv3,
        nodeIndex?: rbush.RBush<INewSpatialItem>,
        graphCalculator?: GraphCalculator,
        edgeCalculator?: EdgeCalculator) {

        this._apiV3 = apiV3;
        this._sequences = {};
        this._nodeCache = {};
        this._tileNodeCache = {};
        this._spatialNodeCache = {};
        this._preTileStore = {};
        this._tileCache = {};
        this._tilePrecision = 7;
        this._tileThreshold = 20;
        this._nodeIndex = nodeIndex != null ? nodeIndex : rbush<INewSpatialItem>(16, [".lon", ".lat", ".lon", ".lat"]);
        this._nodes = {};
        this._graphCalculator = graphCalculator != null ? graphCalculator : new GraphCalculator();
        this._edgeCalculator = edgeCalculator != null ? edgeCalculator : new EdgeCalculator();
        this._defaultAlt = 2;

        this._fetching = {};
        this._filling = {};
        this._cachingSequence = {};
        this._nodeTiles = {};
        this._cachingTile = {};
        this._spatialNodes = {};
        this._cachingSpatialNodes = {};

        this._changed$ = new Subject<NewGraph>();
    }

    public get changed$(): Observable<NewGraph> {
        return this._changed$;
    }

    public hasNode(key: string): boolean {
        return key in this._nodes;
    }

    public getNode(key: string): NewNode {
        return this._nodes[key];
    }

    public fetching(key: string): boolean {
        return key in this._fetching;
    }

    public filling(key: string): boolean {
        return key in this._filling;
    }

    public fetch$(key: string): Observable<NewGraph> {
        if (this.hasNode(key)) {
            throw new Error(`Cannot fetch node that already exist in graph (${key}).`);
        }

        if (key in this._fetching) {
            return this._fetching[key];
        }

        this._fetching[key] = this._apiV3.imageByKeyFull$([key])
            .do(
                (imageByKeyFull: { [key: string]: IFullNode }): void => {
                    let fn: IFullNode = imageByKeyFull[key];

                    if (this.hasNode(key)) {
                        let node: NewNode = this.getNode(key);

                        if (!node.full) {
                            this._makeFull(node, fn);
                        }
                    } else {
                        if (fn.sequence == null || fn.sequence.key == null) {
                            throw new Error(`Node has no sequence (${key}).`);
                        }

                        let node: NewNode = new NewNode(fn);
                        this._makeFull(node, fn);

                        let h: string = this._graphCalculator.encodeH(node.latLon, this._tilePrecision);
                        this._preStore(h, node);
                        this._setNode(node);

                        delete this._fetching[key];
                    }
                })
            .map<NewGraph>(
                (imageByKeyFull: { [key: string]: IFullNode }): NewGraph => {
                    return this;
                })
            .finally(
                (): void => {
                    if (key in this._fetching) {
                        delete this._fetching[key];
                    }

                    this._changed$.next(this);
                })
            .publish()
            .refCount();

        return this._fetching[key];
    }

    public fill$(key: string): Observable<NewGraph> {
        if (key in this._fetching) {
            throw new Error(`Cannot fill node while fetching (${key}).`);
        }

        if (!this.hasNode(key)) {
            throw new Error(`Cannot fill node that does not exist in graph (${key}).`);
        }

        let node: NewNode = this.getNode(key);
        if (node.full) {
            throw new Error(`Cannot fill node that is already full (${key}).`);
        }

        if (key in this._filling) {
            return this._filling[key];
        }

        this._filling[key] = this._apiV3.imageByKeyFill$([key])
            .do(
                (imageByKeyFill: { [key: string]: IFillNode }): void => {
                    if (!node.full) {
                        this._makeFull(node, imageByKeyFill[key]);
                    }

                    delete this._filling[key];
                })
            .map<NewGraph>(
                (imageByKeyFill: { [key: string]: IFillNode }): NewGraph => {
                    return this;
                })
            .finally(
                (): void => {
                    if (key in this._filling) {
                        delete this._filling[key];
                    }

                    this._changed$.next(this);
                })
            .publish()
            .refCount();

        return this._filling[key];
    }

    public sequenceCached(key: string): boolean {
        let node: NewNode = this.getNode(key);

        return node.sequenceKey in this._sequences;
    }

    public cachingSequence(key: string): boolean {
        return key in this._cachingSequence;
    }

    public cacheSequence$(key: string): Observable<NewGraph> {
        if (!this.hasNode(key)) {
            throw new Error(`Cannot cache sequence edges of node that does not exist in graph (${key}).`);
        }

        let node: NewNode = this.getNode(key);
        if (node.sequenceKey in this._sequences) {
            throw new Error(`Sequence already cached (${key}), (${node.sequenceKey}).`);
        }

        if (key in this._cachingSequence) {
            return this._cachingSequence[key];
        }

        this._cachingSequence[key] = this._apiV3.sequenceByKey$([node.sequenceKey])
            .do(
                (sequenceByKey: { [key: string]: ISequence }): void => {
                    if (!(node.sequenceKey in this._sequences)) {
                        this._sequences[node.sequenceKey] = new Sequence(sequenceByKey[node.sequenceKey]);
                    }

                    delete this._cachingSequence[key];
                })
            .map<NewGraph>(
                (sequenceByKey: { [key: string]: ISequence }): NewGraph => {
                    return this;
                })
            .finally(
                (): void => {
                    if (key in this._cachingSequence) {
                        delete this._cachingSequence[key];
                    }

                    this._changed$.next(this);
                })
            .publish()
            .refCount();

        return this._cachingSequence[key];
    }

    public cacheSequenceEdges(key: string): void {
        let node: NewNode = this.getNode(key);

        if (!(node.sequenceKey in this._sequences)) {
            throw new Error(`Sequence is not cached (${key}), (${node.sequenceKey})`);
        }

        let sequence: Sequence = this._sequences[node.sequenceKey];
        let edges: IEdge[] = this._edgeCalculator.computeSequenceEdges(node, sequence);

        node.cacheSequenceEdges(edges);
    }

    public tilesCached(key: string): boolean {
        if (key in this._tileNodeCache) {
            return true;
        }

        if (!this.hasNode(key)) {
            throw new Error(`Node does not exist in graph (${key}).`);
        }

        if (!(key in this._nodeTiles)) {
            let node: NewNode = this.getNode(key);
            let cache: string[] = this._graphCalculator
                .encodeHs(
                    node.latLon,
                    this._tilePrecision,
                    this._tileThreshold)
                .filter(
                    (h: string): boolean => {
                        return !(h in this._tileCache);
                    });

            this._nodeTiles[key] = {
                cache: cache,
                caching: [],
            };
        }

        return this._nodeTiles[key].cache.length === 0 &&
            this._nodeTiles[key].caching.length === 0;
    }

    public cachingTiles(key: string): boolean {
        return key in this._nodeTiles &&
            this._nodeTiles[key].cache.length === 0 &&
            this._nodeTiles[key].caching.length > 0;
    }

    public cacheTiles$(key: string): Observable<NewGraph>[] {
        if (key in this._tileNodeCache) {
            throw new Error(`Tiles already cached (${key}).`);
        }

        if (!(key in this._nodeTiles)) {
            throw new Error(`Tiles have not been determined (${key}).`);
        }

        let nodeTiles: NodeTiles = this._nodeTiles[key];
        if (nodeTiles.cache.length === 0 &&
            nodeTiles.caching.length === 0) {
            throw new Error(`Tiles already cached (${key}).`);
        }

        if (!this.hasNode(key)) {
            throw new Error(`Cannot cache tiles of node that does not exist in graph (${key}).`);
        }

        let hs: string[] = nodeTiles.cache.slice();
        nodeTiles.caching = this._nodeTiles[key].caching.concat(hs);
        nodeTiles.cache = [];

        let cacheTiles$: Observable<NewGraph>[] = [];

        for (let h of nodeTiles.caching) {
            let cacheTile$: Observable<NewGraph> = null;
            if (h in this._cachingTile) {
                cacheTile$ = this._cachingTile[h];
            } else {
                cacheTile$ = this._apiV3.imagesByH$([h])
                    .do(
                        (imagesByH: { [key: string]: { [index: string]: ICoreNode } }): void => {
                            let coreNodes: { [index: string]: ICoreNode } = imagesByH[h];

                            if (h in this._tileCache) {
                                return;
                            }

                            this._tileCache[h] = [];
                            let hCache: NewNode[] = this._tileCache[h];
                            let preStored: { [key: string]: NewNode } = this._removeFromPreStore(h);

                            for (let index in coreNodes) {
                                if (!coreNodes.hasOwnProperty(index)) {
                                    continue;
                                }

                                let coreNode: ICoreNode = coreNodes[index];

                                if (coreNode == null) {
                                    break;
                                }

                                if (coreNode.sequence == null ||
                                    coreNode.sequence.key == null) {
                                    console.warn(`Sequence missing, discarding (${coreNode.key})`);

                                    continue;
                                }

                                if (preStored != null && coreNode.key in preStored) {
                                    let node: NewNode = preStored[coreNode.key];
                                    delete preStored[coreNode.key];

                                    hCache.push(node);
                                    this._nodeIndex.insert({ lat: node.latLon.lat, lon: node.latLon.lon, node: node });

                                    continue;
                                }

                                let node: NewNode = new NewNode(coreNode);

                                hCache.push(node);
                                this._nodeIndex.insert({ lat: node.latLon.lat, lon: node.latLon.lon, node: node });
                                this._setNode(node);
                            }

                            delete this._cachingTile[h];
                        })
                    .map<NewGraph>(
                        (imagesByH: { [key: string]: { [index: string]: ICoreNode } }): NewGraph => {
                            return this;
                        })
                    .catch(
                        (error: Error): Observable<NewGraph> => {
                            delete this._cachingTile[h];

                            throw error;
                        })
                    .publish()
                    .refCount();

                this._cachingTile[h] = cacheTile$;
            }

            cacheTiles$.push(
                cacheTile$
                    .do(
                        (graph: NewGraph): void => {
                            let index: number = nodeTiles.caching.indexOf(h);
                            if (index > -1) {
                                nodeTiles.caching.splice(index, 1);
                            }

                            if (nodeTiles.caching.length === 0 &&
                                nodeTiles.cache.length === 0) {
                                delete this._nodeTiles[key];

                                this._tileNodeCache[key] = true;
                            }
                        })
                    .catch(
                        (error: Error): Observable<NewGraph> => {
                            let index: number = nodeTiles.caching.indexOf(h);
                            if (index > -1) {
                                nodeTiles.caching.splice(index, 1);
                            }

                            if (nodeTiles.caching.length === 0 &&
                                nodeTiles.cache.length === 0) {
                                delete this._nodeTiles[key];

                                this._tileNodeCache[key] = true;
                            }

                            throw error;
                        })
                    .finally(
                        (): void => {
                            this._changed$.next(this);
                        })
                    .publish()
                    .refCount());
        }

        return cacheTiles$;
    }

    public nodeCacheInitialized(key: string): boolean {
        return key in this._nodeCache;
    }

    public initializeNodeCache(key: string): void {
        if (key in this._nodeCache) {
            throw new Error(`Node already in cache (${key}).`);
        }

        let node: NewNode = this.getNode(key);
        node.initializeCache(new NewNodeCache());
        this._nodeCache[key] = node;
    }

    public spatialNodesCached(key: string): boolean {
        if (!this.hasNode(key)) {
            throw new Error(`Cannot cache tiles of node that does not exist in graph (${key}).`);
        }

        if (key in this._spatialNodeCache) {
            return true;
        }

        if (key in this._spatialNodes) {
            return Object.keys(this._spatialNodes[key].cacheNodes).length === 0;
        }

        let node: NewNode = this.getNode(key);
        let bbox: [ILatLon, ILatLon] = this._graphCalculator.boundingBoxCorners(node.latLon, this._tileThreshold);

        let spatialItems: INewSpatialItem[] = this._nodeIndex.search({
            maxX: bbox[1].lon,
            maxY: bbox[1].lat,
            minX: bbox[0].lon,
            minY: bbox[0].lat,
        });

        let spatialNodes: SpatialNodes = {
            all: {},
            cacheKeys: [],
            cacheNodes: {},
        };

        for (let spatialItem of spatialItems) {
            spatialNodes.all[spatialItem.node.key] = spatialItem.node;

            if (!spatialItem.node.full) {
                spatialNodes.cacheKeys.push(spatialItem.node.key);
                spatialNodes.cacheNodes[spatialItem.node.key] = spatialItem.node;
            }
        }

        this._spatialNodes[key] = spatialNodes;

        return spatialNodes.cacheKeys.length === 0;
    }

    public cacheSpatialNodes$(key: string): Observable<NewGraph>[] {
        if (!this.hasNode(key)) {
            throw new Error(`Cannot cache tiles of node that does not exist in graph (${key}).`);
        }

        if (key in this._spatialNodeCache) {
            throw new Error(`Node already spatially cached (${key}).`);
        }

        if (!(key in this._spatialNodes)) {
            throw new Error(`Spatial nodes not determined (${key}).`);
        }

        let spatialNodes: SpatialNodes = this._spatialNodes[key];
        if (Object.keys(spatialNodes.cacheNodes).length === 0) {
            throw new Error(`Spatial nodes already cached (${key}).`);
        }

        if (key in this._cachingSpatialNodes) {
            return this._cachingSpatialNodes[key];
        }

        let batches: string[][] = [];
        while (spatialNodes.cacheKeys.length > 0) {
            batches.push(spatialNodes.cacheKeys.splice(0, 200));
        }

        let batchesToCache: number = batches.length;
        let spatialNodes$: Observable<NewGraph>[] = [];

        for (let batch of batches) {
            let spatialNodeBatch$: Observable<NewGraph> = this._apiV3.imageByKeyFill$(batch)
                .do(
                    (imageByKeyFill: { [key: string]: IFillNode }): void => {
                        for (let fillKey in imageByKeyFill) {
                            if (!imageByKeyFill.hasOwnProperty(fillKey)) {
                                continue;
                            }

                            let spatialNode: NewNode = spatialNodes.cacheNodes[fillKey];
                            if (spatialNode.full) {
                                delete spatialNodes.cacheNodes[fillKey];
                                continue;
                            }

                            let fillNode: IFillNode = imageByKeyFill[fillKey];
                            spatialNode.makeFull(fillNode);

                            delete spatialNodes.cacheNodes[fillKey];
                        }

                        if (--batchesToCache === 0) {
                            delete this._cachingSpatialNodes[key];
                        }
                    })
                .map<NewGraph>(
                    (imageByKeyFill: { [key: string]: IFillNode }): NewGraph => {
                        return this;
                    })
                .catch(
                    (error: Error): Observable<NewGraph> => {
                        for (let batchKey of batch) {
                            if (batchKey in spatialNodes.all) {
                                delete spatialNodes.all[batchKey];
                            }

                            if (batchKey in spatialNodes.cacheNodes) {
                                delete spatialNodes.cacheNodes[batchKey];
                            }
                        }

                        if (--batchesToCache === 0) {
                            delete this._cachingSpatialNodes[key];
                        }

                        throw error;
                    })
                .finally(
                    (): void => {
                        if (Object.keys(spatialNodes.cacheNodes).length === 0) {
                            this._changed$.next(this);
                        }
                    })
                .publish()
                .refCount();

            spatialNodes$.push(spatialNodeBatch$);
        }

        this._cachingSpatialNodes[key] = spatialNodes$;

        return spatialNodes$;
    }

    public cacheSpatialEdges(key: string): void {
        if (key in this._spatialNodeCache) {
             throw new Error(`Node already spatially cached (${key}).`);
        }

        let node: NewNode = this.getNode(key);
        let sequence: Sequence = this._sequences[node.sequenceKey];

        let fallbackKeys: string[] = [];
        let nextKey: string = sequence.findNextKey(node.key);
        let prevKey: string = sequence.findPrevKey(node.key);

        let allSpatialNodes: { [key: string]: NewNode } = this._spatialNodes[key].all;
        let potentialNodes: NewNode[] = [];
        for (let spatialNodeKey in allSpatialNodes) {
            if (!allSpatialNodes.hasOwnProperty(spatialNodeKey)) {
                continue;
            }

            potentialNodes.push(allSpatialNodes[spatialNodeKey]);
        }

        let potentialEdges: IPotentialEdge[] = this._edgeCalculator.getPotentialEdges(node, potentialNodes, fallbackKeys);

        let edges: IEdge[] =
            this._edgeCalculator.computeStepEdges(
                node,
                potentialEdges,
                prevKey,
                nextKey);

        edges = edges.concat(this._edgeCalculator.computeTurnEdges(node, potentialEdges));
        edges = edges.concat(this._edgeCalculator.computePanoEdges(node, potentialEdges));
        edges = edges.concat(this._edgeCalculator.computePerspectiveToPanoEdges(node, potentialEdges));
        edges = edges.concat(this._edgeCalculator.computeSimilarEdges(node, potentialEdges));

        node.cacheSpatialEdges(edges);

        this._spatialNodeCache[key] = node;
        delete this._spatialNodes[key];
    }

    public reset(): void {
        let spatialNodeKeys: string[] = Object.keys(this._spatialNodes);

        for (let spatialNodeKey of spatialNodeKeys) {
            delete this._spatialNodes[spatialNodeKey];
        }

        let cachedKeys: string[] = Object.keys(this._spatialNodeCache);

        for (let cachedKey of cachedKeys) {
            let node: NewNode = this._spatialNodeCache[cachedKey];
            node.resetSpatialEdges();

            delete this._spatialNodeCache[cachedKey];
        }
    }

    private _makeFull(node: NewNode, fillNode: IFillNode): void {
        if (fillNode.calt == null) {
            fillNode.calt = this._defaultAlt;
        }

        if (fillNode.c_rotation == null) {
            fillNode.c_rotation = this._graphCalculator.rotationFromCompass(node.ca, fillNode.orientation);
        }

        node.makeFull(fillNode);
    }

    private _preStore(h: string, node: NewNode): void {
        if (!(h in this._preTileStore)) {
            this._preTileStore[h] = {};
        }

        this._preTileStore[h][node.key] = node;
    }

    private _removeFromPreStore(h: string): { [key: string]: NewNode } {
        let preStored: { [key: string]: NewNode } = null;

        if (h in this._preTileStore) {
            preStored = this._preTileStore[h];
            delete this._preTileStore[h];
        }

        return preStored;
    }

    private _setNode(node: NewNode): void {
        let key: string = node.key;

        if (this.hasNode(key)) {
            throw new Error(`Graph already has node (${key}).`);
        }

        this._nodes[key] = node;
    }
}

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

interface ISpatialItem {
    lat: number;
    lon: number;
    node: Node;
}

type SequenceHash = {[key: string]: Sequence};

export class Graph {
    private _sequences: SequenceHash;
    private _sequenceHashes: {[skey: string]: SequenceHash};

    private _graph: graphlib.Graph<Node, IEdgeData>;
    private _nodeIndex: rbush.RBush<ISpatialItem>;

    private _unWorthyNodes: {[key: string]: boolean};

    private _defaultAlt: number = 2;

    private _spatial: Spatial;
    private _geoCoords: GeoCoords;

    /**
     * Creates a graph instance
     * @class Graph
     */
    constructor () {
        this._sequences = {};
        this._sequenceHashes = {};
        this._nodeIndex = rbush<ISpatialItem>(16, [".lon", ".lat", ".lon", ".lat"]);
        this._graph = new graphlib.Graph<Node, IEdgeData>({ multigraph: true });
        this._unWorthyNodes = {};
        this._spatial = new Spatial();
        this._geoCoords = new GeoCoords();
    }

    /**
     * Add nodes from an API call
     * @param {IAPINavIm} data - Image tile
     */
    public addNodesFromAPI(data: IAPINavIm, tiles: {[key: string]: boolean}): void {
        if (data === undefined) {
            return;
        }

        let h: string = data.hs[0];
        let bounds: geohash.IBounds = geohash.bounds(h);
        let neighbours: { [key: string]: string } = geohash.neighbours(h);

        let hSequenceHashes: SequenceHash[] = [];

        for (let s of data.ss) {
            let skey: string = s.key;

            if (skey in this._sequences) {
                hSequenceHashes.push(this._sequenceHashes[skey]);
                continue;
            }

            let sequence: Sequence = new Sequence(s);
            this._sequences[skey] = sequence;

            let sequenceHash: SequenceHash = {};
            for (let key of s.keys) {
                sequenceHash[key] = sequence;
            }

            this._sequenceHashes[skey] = sequenceHash;
            hSequenceHashes.push(sequenceHash);
        }

        let nodes: Node[] = _.map(data.ims, (im: IAPINavImIm): Node => {
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

            if (im.calt == null) {
                im.calt = this._defaultAlt;
            }

            let latLon: ILatLon = {lat: lat, lon: lon};

            if (im.rotation == null) {
                im.rotation = this._computeRotation(im.ca, im.orientation);
            }

            let hs: string[] = this._computeHs(latLon, bounds.sw, bounds.ne, h, neighbours);

            let sequence: Sequence = null;
            for (let ts of hSequenceHashes) {
                if (im.key in ts) {
                    sequence = ts[im.key];
                    break;
                }
            }

            let node: Node = new Node(ca, latLon, false, sequence, im, hs);

            this._unWorthyNodes[im.key] = true;

            return node;
        });

        this._insertNodes(nodes);
        this._makeNodesWorthy(tiles);
    }

    /**
     * Get node from valid `key`
     * @param {string} key - valid Mapillary photo key
     * @return {Node}
     */
    public getNode(key: string): Node {
        return this._graph.node(key);
    }

    /**
     * Get edges for the given node
     * @param {Node} node - The node
     * @return {IEdge}
     */
    public getEdges(node: Node): IEdge[] {
        let outEdges: graphlib.Edge[] = this._graph.outEdges(node.key);

        return _.map(outEdges, (outEdge: graphlib.Edge) => {
            let data: IEdgeData = this._graph.edge(outEdge);

            return {
                data: data,
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
        if (this._computeEdges(node)) {
            node.cacheEdges(this.getEdges(node));
        }
    }

    /**
     * Find next node in the graph
     * @param {Node} node
     * @param {Direction} dir
     * @return {Node}
     */
    public nextNode(node: Node, dir: EdgeDirection): Node {
        let key: string = this.nextKey(node, dir);

        return key == null ? null : this.getNode(key);
    }

    public nextKey(node: Node, dir: EdgeDirection): string {
        let outEdges: graphlib.Edge[] = this._graph.outEdges(node.key);

        for (let outEdge of outEdges) {
            let edgeData: IEdgeData = this._graph.edge(outEdge);

            if (edgeData.direction === dir) {
                return outEdge.w;
            }
        }

        return null;
    }

    /**
     * Add edges to given node
     * @param {Node} node
     * @param {IEdge[]} edges
     */
    private _addEdgesToNode(node: Node, edges: IEdge[]): void {
        let outEdges: graphlib.Edge[] = this._graph.outEdges(node.key);

        for (let outEdge of outEdges) {
            this._graph.removeEdge(outEdge);
        }

        for (let edge of edges) {
            this._graph.setEdge(node.key, edge.to, edge.data, node.key + edge.to + edge.data.direction);
        }
    }

    /**
     * Compute edges for the given node
     * @param {Node} node
     * @return {boolean}
     */
    private _computeEdges(node: Node): boolean {
        if (!node.worthy) {
            return false;
        }

        let edges: IEdge[] = [];
        this._addEdgesToNode(node, edges);

        return true;
    }

    private _computeHs(
        latLon: ILatLon,
        sw: ILatLon,
        ne: ILatLon,
        h: string,
        neighbours: { [key: string]: string }): string[] {

        let hs: string[] = [h];

        let bl: number[] = [0, 0, 0];
        let tr: number[] =
            this._geoCoords.geodeticToEnu(
                ne.lat,
                ne.lon,
                0,
                sw.lat,
                sw.lon,
                0);

        let position: number[] =
            this._geoCoords.geodeticToEnu(
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
    private _computeRotation(compassAngle: number, orientation: number): number[] {
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
     * Insert given nodes
     * @param {Node[]}
     */
    private _insertNodes(nodes: Node[]): void {
        _.each(nodes, (node: Node) => {
            this._insertNode(node);
        });
    }

    /**
     * Insert node
     * @param {Node} node
     */
    private _insertNode(node: Node): void {
        if (this.getNode(node.key) != null) {
            return;
        }

        this._nodeIndex.insert({ lat: node.latLon.lat, lon: node.latLon.lon, node: node });
        this._graph.setNode(node.key, node);
    }

    private _makeNodesWorthy(tiles: {[key: string]: boolean}): void {
        let worthy: boolean;
        let worthyKeys: string[] = [];
        for (let key in this._unWorthyNodes) {
            if (!this._unWorthyNodes.hasOwnProperty(key)) {
                continue;
            }

            if (!this._unWorthyNodes[key]) {
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
                node.makeWorthy();
                this._unWorthyNodes[key] = false;
                worthyKeys.push(key);
            }
        }

        for (let key of worthyKeys) {
            delete this._unWorthyNodes[key];
        }
    }
}

export default Graph;
