/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/from";

import "rxjs/add/operator/catch";
import "rxjs/add/operator/do";
import "rxjs/add/operator/finally";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publish";

import * as _ from "underscore";
import * as graphlib from "graphlib";
import * as rbush from "rbush";
import * as THREE from "three";
import * as geohash from "latlon-geohash";

import {APIv3, IAPINavIm, IAPINavImIm, ICoreNode, IFillNode, IFullNode, ISequence} from "../API";
import {IEdge, IPotentialEdge, IEdgeData, EdgeCalculator, EdgeDirection} from "../Edge";
import {GraphMapillaryError} from "../Error";
import {Spatial, GeoCoords, ILatLon} from "../Geo";
import {NewNode, NewNodeCache, Node, Sequence, GraphCalculator} from "../Graph";

type NodeIndexItem = {
    lat: number;
    lon: number;
    node: NewNode;
}

type NodeTiles = {
    cache: string[];
    caching: string[];
}

type SpatialArea = {
    all: { [key: string]: NewNode };
    cacheKeys: string[];
    cacheNodes: { [key: string]: NewNode };
}

export class NewGraph {
    private _apiV3: APIv3;

    private _cachedNodes: { [key: string]: NewNode };
    private _cachedNodeTiles: { [key: string]: boolean };
    private _cachedSpatialEdges: { [key: string]: NewNode };
    private _cachedTiles: { [h: string]: NewNode[] };

    private _cachingFill$: { [key: string]: Observable<NewGraph> };
    private _cachingFull$: { [key: string]: Observable<NewGraph> };
    private _cachingSequences$: { [sequenceKey: string]: Observable<NewGraph> };
    private _cachingSpatialArea$: { [key: string]: Observable<NewGraph>[] };
    private _cachingTiles$: { [h: string]: Observable<NewGraph> };

    private _changed$: Subject<NewGraph>;

    private _defaultAlt: number;
    private _edgeCalculator: EdgeCalculator;
    private _graphCalculator: GraphCalculator;

    private _nodes: { [key: string]: NewNode };
    private _nodeIndex: rbush.RBush<NodeIndexItem>;

    private _preStored: { [h: string]:  { [key: string]: NewNode }; };

    private _requiredNodeTiles: { [key: string]: NodeTiles };
    private _requiredSpatialArea: { [key: string]: SpatialArea };

    private _sequences: { [skey: string]: Sequence };

    private _tilePrecision: number;
    private _tileThreshold: number;

    constructor(
        apiV3: APIv3,
        nodeIndex?: rbush.RBush<NodeIndexItem>,
        graphCalculator?: GraphCalculator,
        edgeCalculator?: EdgeCalculator) {

        this._apiV3 = apiV3;

        this._cachedNodes = {};
        this._cachedNodeTiles = {};
        this._cachedSpatialEdges = {};
        this._cachedTiles = {};

        this._cachingFill$ = {};
        this._cachingFull$ = {};
        this._cachingSequences$ = {};
        this._cachingSpatialArea$ = {};
        this._cachingTiles$ = {};

        this._changed$ = new Subject<NewGraph>();

        this._defaultAlt = 2;
        this._edgeCalculator = edgeCalculator != null ? edgeCalculator : new EdgeCalculator();
        this._graphCalculator = graphCalculator != null ? graphCalculator : new GraphCalculator();

        this._nodes = {};
        this._nodeIndex = nodeIndex != null ? nodeIndex : rbush<NodeIndexItem>(16, [".lon", ".lat", ".lon", ".lat"]);

        this._preStored = {};

        this._requiredNodeTiles = {};
        this._requiredSpatialArea = {};

        this._sequences = {};

        this._tilePrecision = 7;
        this._tileThreshold = 20;
    }

    public get changed$(): Observable<NewGraph> {
        return this._changed$;
    }

    public cacheFill$(key: string): Observable<NewGraph> {
        if (key in this._cachingFull$) {
            throw new GraphMapillaryError(`Cannot fill node while caching full (${key}).`);
        }

        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Cannot fill node that does not exist in graph (${key}).`);
        }

        if (key in this._cachingFill$) {
            return this._cachingFill$[key];
        }

        let node: NewNode = this.getNode(key);
        if (node.full) {
            throw new GraphMapillaryError(`Cannot fill node that is already full (${key}).`);
        }

        this._cachingFill$[key] = this._apiV3.imageByKeyFill$([key])
            .do(
                (imageByKeyFill: { [key: string]: IFillNode }): void => {
                    if (!node.full) {
                        this._makeFull(node, imageByKeyFill[key]);
                    }

                    delete this._cachingFill$[key];
                })
            .map<NewGraph>(
                (imageByKeyFill: { [key: string]: IFillNode }): NewGraph => {
                    return this;
                })
            .finally(
                (): void => {
                    if (key in this._cachingFill$) {
                        delete this._cachingFill$[key];
                    }

                    this._changed$.next(this);
                })
            .publish()
            .refCount();

        return this._cachingFill$[key];
    }

    public cacheFull$(key: string): Observable<NewGraph> {
        if (key in this._cachingFull$) {
            return this._cachingFull$[key];
        }

        if (this.hasNode(key)) {
            throw new GraphMapillaryError(`Cannot cache full node that already exist in graph (${key}).`);
        }

        this._cachingFull$[key] = this._apiV3.imageByKeyFull$([key])
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
                            throw new GraphMapillaryError(`Node has no sequence (${key}).`);
                        }

                        let node: NewNode = new NewNode(fn);
                        this._makeFull(node, fn);

                        let h: string = this._graphCalculator.encodeH(node.originalLatLon, this._tilePrecision);
                        this._preStore(h, node);
                        this._setNode(node);

                        delete this._cachingFull$[key];
                    }
                })
            .map<NewGraph>(
                (imageByKeyFull: { [key: string]: IFullNode }): NewGraph => {
                    return this;
                })
            .finally(
                (): void => {
                    if (key in this._cachingFull$) {
                        delete this._cachingFull$[key];
                    }

                    this._changed$.next(this);
                })
            .publish()
            .refCount();

        return this._cachingFull$[key];
    }

    public cacheNodeSequence$(key: string): Observable<NewGraph> {
        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Cannot cache sequence edges of node that does not exist in graph (${key}).`);
        }

        let node: NewNode = this.getNode(key);
        if (node.sequenceKey in this._sequences) {
            throw new GraphMapillaryError(`Sequence already cached (${key}), (${node.sequenceKey}).`);
        }

        if (node.sequenceKey in this._cachingSequences$) {
            return this._cachingSequences$[node.sequenceKey];
        }

        this._cachingSequences$[node.sequenceKey] = this._apiV3.sequenceByKey$([node.sequenceKey])
            .do(
                (sequenceByKey: { [key: string]: ISequence }): void => {
                    if (!(node.sequenceKey in this._sequences)) {
                        this._sequences[node.sequenceKey] = new Sequence(sequenceByKey[node.sequenceKey]);
                    }

                    delete this._cachingSequences$[node.sequenceKey];
                })
            .map<NewGraph>(
                (sequenceByKey: { [key: string]: ISequence }): NewGraph => {
                    return this;
                })
            .finally(
                (): void => {
                    if (key in this._cachingSequences$) {
                        delete this._cachingSequences$[node.sequenceKey];
                    }

                    this._changed$.next(this);
                })
            .publish()
            .refCount();

        return this._cachingSequences$[node.sequenceKey];
    }

    public cacheSequenceEdges(key: string): void {
        let node: NewNode = this.getNode(key);

        if (!(node.sequenceKey in this._sequences)) {
            throw new GraphMapillaryError(`Sequence is not cached (${key}), (${node.sequenceKey})`);
        }

        let sequence: Sequence = this._sequences[node.sequenceKey];
        let edges: IEdge[] = this._edgeCalculator.computeSequenceEdges(node, sequence);

        node.cacheSequenceEdges(edges);
    }

    public cacheSpatialArea$(key: string): Observable<NewGraph>[] {
        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Cannot cache spatial area of node that does not exist in graph (${key}).`);
        }

        if (key in this._cachedSpatialEdges) {
            throw new GraphMapillaryError(`Node already spatially cached (${key}).`);
        }

        if (!(key in this._requiredSpatialArea)) {
            throw new GraphMapillaryError(`Spatial area not determined (${key}).`);
        }

        let spatialArea: SpatialArea = this._requiredSpatialArea[key];
        if (Object.keys(spatialArea.cacheNodes).length === 0) {
            throw new GraphMapillaryError(`Spatial nodes already cached (${key}).`);
        }

        if (key in this._cachingSpatialArea$) {
            return this._cachingSpatialArea$[key];
        }

        let batches: string[][] = [];
        while (spatialArea.cacheKeys.length > 0) {
            batches.push(spatialArea.cacheKeys.splice(0, 200));
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

                            let spatialNode: NewNode = spatialArea.cacheNodes[fillKey];
                            if (spatialNode.full) {
                                delete spatialArea.cacheNodes[fillKey];
                                continue;
                            }

                            let fillNode: IFillNode = imageByKeyFill[fillKey];
                            this._makeFull(spatialNode, fillNode);

                            delete spatialArea.cacheNodes[fillKey];
                        }

                        if (--batchesToCache === 0) {
                            delete this._cachingSpatialArea$[key];
                        }
                    })
                .map<NewGraph>(
                    (imageByKeyFill: { [key: string]: IFillNode }): NewGraph => {
                        return this;
                    })
                .catch(
                    (error: Error): Observable<NewGraph> => {
                        for (let batchKey of batch) {
                            if (batchKey in spatialArea.all) {
                                delete spatialArea.all[batchKey];
                            }

                            if (batchKey in spatialArea.cacheNodes) {
                                delete spatialArea.cacheNodes[batchKey];
                            }
                        }

                        if (--batchesToCache === 0) {
                            delete this._cachingSpatialArea$[key];
                        }

                        throw error;
                    })
                .finally(
                    (): void => {
                        if (Object.keys(spatialArea.cacheNodes).length === 0) {
                            this._changed$.next(this);
                        }
                    })
                .publish()
                .refCount();

            spatialNodes$.push(spatialNodeBatch$);
        }

        this._cachingSpatialArea$[key] = spatialNodes$;

        return spatialNodes$;
    }

    public cacheSpatialEdges(key: string): void {
        if (key in this._cachedSpatialEdges) {
             throw new GraphMapillaryError(`Spatial edges already cached (${key}).`);
        }

        let node: NewNode = this.getNode(key);
        let sequence: Sequence = this._sequences[node.sequenceKey];

        let fallbackKeys: string[] = [];
        let nextKey: string = sequence.findNextKey(node.key);
        let prevKey: string = sequence.findPrevKey(node.key);

        let allSpatialNodes: { [key: string]: NewNode } = this._requiredSpatialArea[key].all;
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

        this._cachedSpatialEdges[key] = node;
        delete this._requiredSpatialArea[key];
    }

    public cacheTiles$(key: string): Observable<NewGraph>[] {
        if (key in this._cachedNodeTiles) {
            throw new GraphMapillaryError(`Tiles already cached (${key}).`);
        }

        if (!(key in this._requiredNodeTiles)) {
            throw new GraphMapillaryError(`Tiles have not been determined (${key}).`);
        }

        let nodeTiles: NodeTiles = this._requiredNodeTiles[key];
        if (nodeTiles.cache.length === 0 &&
            nodeTiles.caching.length === 0) {
            throw new GraphMapillaryError(`Tiles already cached (${key}).`);
        }

        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Cannot cache tiles of node that does not exist in graph (${key}).`);
        }

        let hs: string[] = nodeTiles.cache.slice();
        nodeTiles.caching = this._requiredNodeTiles[key].caching.concat(hs);
        nodeTiles.cache = [];

        let cacheTiles$: Observable<NewGraph>[] = [];

        for (let h of nodeTiles.caching) {
            let cacheTile$: Observable<NewGraph> = null;
            if (h in this._cachingTiles$) {
                cacheTile$ = this._cachingTiles$[h];
            } else {
                cacheTile$ = this._apiV3.imagesByH$([h])
                    .do(
                        (imagesByH: { [key: string]: { [index: string]: ICoreNode } }): void => {
                            let coreNodes: { [index: string]: ICoreNode } = imagesByH[h];

                            if (h in this._cachedTiles) {
                                return;
                            }

                            this._cachedTiles[h] = [];
                            let hCache: NewNode[] = this._cachedTiles[h];
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

                            delete this._cachingTiles$[h];
                        })
                    .map<NewGraph>(
                        (imagesByH: { [key: string]: { [index: string]: ICoreNode } }): NewGraph => {
                            return this;
                        })
                    .catch(
                        (error: Error): Observable<NewGraph> => {
                            delete this._cachingTiles$[h];

                            throw error;
                        })
                    .publish()
                    .refCount();

                this._cachingTiles$[h] = cacheTile$;
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
                                delete this._requiredNodeTiles[key];

                                this._cachedNodeTiles[key] = true;
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
                                delete this._requiredNodeTiles[key];

                                this._cachedNodeTiles[key] = true;
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

    public initializeCache(key: string): void {
        if (key in this._cachedNodes) {
            throw new GraphMapillaryError(`Node already in cache (${key}).`);
        }

        let node: NewNode = this.getNode(key);
        node.initializeCache(new NewNodeCache());
        this._cachedNodes[key] = node;
    }

    public isCacheInitialized(key: string): boolean {
        return key in this._cachedNodes;
    }

    public isCachingFill(key: string): boolean {
        return key in this._cachingFill$;
    }

    public isCachingFull(key: string): boolean {
        return key in this._cachingFull$;
    }

    public isCachingNodeSequence(key: string): boolean {
        let node: NewNode = this.getNode(key);

        return node.sequenceKey in this._cachingSequences$;
    }

    public isCachingTiles(key: string): boolean {
        return key in this._requiredNodeTiles &&
            this._requiredNodeTiles[key].cache.length === 0 &&
            this._requiredNodeTiles[key].caching.length > 0;
    }

    public isSpatialAreaCached(key: string): boolean {
        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Spatial area nodes cannot be determined if node not in graph (${key}).`);
        }

        if (key in this._cachedSpatialEdges) {
            return true;
        }

        if (key in this._requiredSpatialArea) {
            return Object.keys(this._requiredSpatialArea[key].cacheNodes).length === 0;
        }

        let node: NewNode = this.getNode(key);
        let bbox: [ILatLon, ILatLon] = this._graphCalculator.boundingBoxCorners(node.latLon, this._tileThreshold);

        let spatialItems: NodeIndexItem[] = this._nodeIndex.search({
            maxX: bbox[1].lon,
            maxY: bbox[1].lat,
            minX: bbox[0].lon,
            minY: bbox[0].lat,
        });

        let spatialNodes: SpatialArea = {
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

        this._requiredSpatialArea[key] = spatialNodes;

        return spatialNodes.cacheKeys.length === 0;
    }

    public hasNode(key: string): boolean {
        return key in this._nodes;
    }

    public hasNodeSequence(key: string): boolean {
        let node: NewNode = this.getNode(key);

        return node.sequenceKey in this._sequences;
    }

    public hasTiles(key: string): boolean {
        if (key in this._cachedNodeTiles) {
            return true;
        }

        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Node does not exist in graph (${key}).`);
        }

        if (!(key in this._requiredNodeTiles)) {
            let node: NewNode = this.getNode(key);
            let cache: string[] = this._graphCalculator
                .encodeHs(
                    node.latLon,
                    this._tilePrecision,
                    this._tileThreshold)
                .filter(
                    (h: string): boolean => {
                        return !(h in this._cachedTiles);
                    });

            this._requiredNodeTiles[key] = {
                cache: cache,
                caching: [],
            };
        }

        return this._requiredNodeTiles[key].cache.length === 0 &&
            this._requiredNodeTiles[key].caching.length === 0;
    }

    public getNode(key: string): NewNode {
        return this._nodes[key];
    }

    public reset(): void {
        let spatialNodeKeys: string[] = Object.keys(this._requiredSpatialArea);

        for (let spatialNodeKey of spatialNodeKeys) {
            delete this._requiredSpatialArea[spatialNodeKey];
        }

        let cachedKeys: string[] = Object.keys(this._cachedSpatialEdges);

        for (let cachedKey of cachedKeys) {
            let node: NewNode = this._cachedSpatialEdges[cachedKey];
            node.resetSpatialEdges();

            delete this._cachedSpatialEdges[cachedKey];
        }
    }

    private _makeFull(node: NewNode, fillNode: IFillNode): void {
        if (fillNode.calt == null) {
            fillNode.calt = this._defaultAlt;
        }

        if (fillNode.c_rotation == null) {
            fillNode.c_rotation = this._graphCalculator.rotationFromCompass(fillNode.ca, fillNode.orientation);
        }

        node.makeFull(fillNode);
    }

    private _preStore(h: string, node: NewNode): void {
        if (!(h in this._preStored)) {
            this._preStored[h] = {};
        }

        this._preStored[h][node.key] = node;
    }

    private _removeFromPreStore(h: string): { [key: string]: NewNode } {
        let preStored: { [key: string]: NewNode } = null;

        if (h in this._preStored) {
            preStored = this._preStored[h];
            delete this._preStored[h];
        }

        return preStored;
    }

    private _setNode(node: NewNode): void {
        let key: string = node.key;

        if (this.hasNode(key)) {
            throw new GraphMapillaryError(`Node already exist (${key}).`);
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
