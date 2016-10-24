/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/from";

import "rxjs/add/operator/catch";
import "rxjs/add/operator/do";
import "rxjs/add/operator/finally";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publish";

import * as rbush from "rbush";

import {
    APIv3,
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
} from "../API";
import {
    IEdge,
    IPotentialEdge,
    EdgeCalculator,
} from "../Edge";
import {GraphMapillaryError} from "../Error";
import {
    ILatLon,
} from "../Geo";
import {
    Node,
    NodeCache,
    Sequence,
    GraphCalculator,
} from "../Graph";

type NodeIndexItem = {
    lat: number;
    lon: number;
    node: Node;
}

type NodeTiles = {
    cache: string[];
    caching: string[];
}

type SpatialArea = {
    all: { [key: string]: Node };
    cacheKeys: string[];
    cacheNodes: { [key: string]: Node };
}

export class Graph {
    private _apiV3: APIv3;

    private _cachedNodes: { [key: string]: Node };
    private _cachedNodeTiles: { [key: string]: boolean };
    private _cachedSpatialEdges: { [key: string]: Node };
    private _cachedTiles: { [h: string]: Node[] };

    private _cachingFill$: { [key: string]: Observable<Graph> };
    private _cachingFull$: { [key: string]: Observable<Graph> };
    private _cachingSequences$: { [sequenceKey: string]: Observable<Graph> };
    private _cachingSpatialArea$: { [key: string]: Observable<Graph>[] };
    private _cachingTiles$: { [h: string]: Observable<Graph> };

    private _changed$: Subject<Graph>;

    private _defaultAlt: number;
    private _edgeCalculator: EdgeCalculator;
    private _graphCalculator: GraphCalculator;

    private _nodes: { [key: string]: Node };
    private _nodeIndex: rbush.RBush<NodeIndexItem>;

    private _preStored: { [h: string]:  { [key: string]: Node }; };

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

        this._changed$ = new Subject<Graph>();

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

    public get changed$(): Observable<Graph> {
        return this._changed$;
    }

    public cacheFill$(key: string): Observable<Graph> {
        if (key in this._cachingFull$) {
            throw new GraphMapillaryError(`Cannot fill node while caching full (${key}).`);
        }

        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Cannot fill node that does not exist in graph (${key}).`);
        }

        if (key in this._cachingFill$) {
            return this._cachingFill$[key];
        }

        let node: Node = this.getNode(key);
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
            .map<Graph>(
                (imageByKeyFill: { [key: string]: IFillNode }): Graph => {
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

    public cacheFull$(key: string): Observable<Graph> {
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
                        let node: Node = this.getNode(key);

                        if (!node.full) {
                            this._makeFull(node, fn);
                        }
                    } else {
                        if (fn.sequence == null || fn.sequence.key == null) {
                            throw new GraphMapillaryError(`Node has no sequence (${key}).`);
                        }

                        let node: Node = new Node(fn);
                        this._makeFull(node, fn);

                        let h: string = this._graphCalculator.encodeH(node.originalLatLon, this._tilePrecision);
                        this._preStore(h, node);
                        this._setNode(node);

                        delete this._cachingFull$[key];
                    }
                })
            .map<Graph>(
                (imageByKeyFull: { [key: string]: IFullNode }): Graph => {
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

    public cacheNodeSequence$(key: string): Observable<Graph> {
        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Cannot cache sequence edges of node that does not exist in graph (${key}).`);
        }

        let node: Node = this.getNode(key);
        if (node.sequenceKey in this._sequences) {
            throw new GraphMapillaryError(`Sequence already cached (${key}), (${node.sequenceKey}).`);
        }

        return this._cacheSequence$(node.sequenceKey);
    }

    public cacheSequence$(sequenceKey: string): Observable<Graph> {
        if (sequenceKey in this._sequences) {
            throw new GraphMapillaryError(`Sequence already cached (${sequenceKey})`);
        }

        return this._cacheSequence$(sequenceKey);
    }

    public cacheSequenceEdges(key: string): void {
        let node: Node = this.getNode(key);

        if (!(node.sequenceKey in this._sequences)) {
            throw new GraphMapillaryError(`Sequence is not cached (${key}), (${node.sequenceKey})`);
        }

        let sequence: Sequence = this._sequences[node.sequenceKey];
        let edges: IEdge[] = this._edgeCalculator.computeSequenceEdges(node, sequence);

        node.cacheSequenceEdges(edges);
    }

    public cacheSpatialArea$(key: string): Observable<Graph>[] {
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
        let spatialNodes$: Observable<Graph>[] = [];

        for (let batch of batches) {
            let spatialNodeBatch$: Observable<Graph> = this._apiV3.imageByKeyFill$(batch)
                .do(
                    (imageByKeyFill: { [key: string]: IFillNode }): void => {
                        for (let fillKey in imageByKeyFill) {
                            if (!imageByKeyFill.hasOwnProperty(fillKey)) {
                                continue;
                            }

                            let spatialNode: Node = spatialArea.cacheNodes[fillKey];
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
                .map<Graph>(
                    (imageByKeyFill: { [key: string]: IFillNode }): Graph => {
                        return this;
                    })
                .catch(
                    (error: Error): Observable<Graph> => {
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

        let node: Node = this.getNode(key);
        let sequence: Sequence = this._sequences[node.sequenceKey];

        let fallbackKeys: string[] = [];
        let nextKey: string = sequence.findNextKey(node.key);
        let prevKey: string = sequence.findPrevKey(node.key);

        let allSpatialNodes: { [key: string]: Node } = this._requiredSpatialArea[key].all;
        let potentialNodes: Node[] = [];
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

    public cacheTiles$(key: string): Observable<Graph>[] {
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

        let cacheTiles$: Observable<Graph>[] = [];

        for (let h of nodeTiles.caching) {
            let cacheTile$: Observable<Graph> = null;
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
                            let hCache: Node[] = this._cachedTiles[h];
                            let preStored: { [key: string]: Node } = this._removeFromPreStore(h);

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
                                    let node: Node = preStored[coreNode.key];
                                    delete preStored[coreNode.key];

                                    hCache.push(node);
                                    this._nodeIndex.insert({ lat: node.latLon.lat, lon: node.latLon.lon, node: node });

                                    continue;
                                }

                                let node: Node = new Node(coreNode);

                                hCache.push(node);
                                this._nodeIndex.insert({ lat: node.latLon.lat, lon: node.latLon.lon, node: node });
                                this._setNode(node);
                            }

                            delete this._cachingTiles$[h];
                        })
                    .map<Graph>(
                        (imagesByH: { [key: string]: { [index: string]: ICoreNode } }): Graph => {
                            return this;
                        })
                    .catch(
                        (error: Error): Observable<Graph> => {
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
                        (graph: Graph): void => {
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
                        (error: Error): Observable<Graph> => {
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

        let node: Node = this.getNode(key);
        node.initializeCache(new NodeCache());
        this._cachedNodes[key] = node;
    }

    public isCachingFill(key: string): boolean {
        return key in this._cachingFill$;
    }

    public isCachingFull(key: string): boolean {
        return key in this._cachingFull$;
    }

    public isCachingNodeSequence(key: string): boolean {
        let node: Node = this.getNode(key);

        return node.sequenceKey in this._cachingSequences$;
    }

    public isCachingSequence(sequenceKey: string): boolean {
        return sequenceKey in this._cachingSequences$;
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

        let node: Node = this.getNode(key);
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

    public hasInitializedCache(key: string): boolean {
        return key in this._cachedNodes;
    }

    public hasNode(key: string): boolean {
        return key in this._nodes;
    }

    public hasNodeSequence(key: string): boolean {
        let node: Node = this.getNode(key);

        return node.sequenceKey in this._sequences;
    }

    public hasSequence(sequenceKey: string): boolean {
        return sequenceKey in this._sequences;
    }

    public hasTiles(key: string): boolean {
        if (key in this._cachedNodeTiles) {
            return true;
        }

        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Node does not exist in graph (${key}).`);
        }

        if (!(key in this._requiredNodeTiles)) {
            let node: Node = this.getNode(key);
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

    public getNode(key: string): Node {
        return this._nodes[key];
    }

    public getSequence(sequenceKey: string): Sequence {
        return this._sequences[sequenceKey];
    }

    public reset(): void {
        let spatialNodeKeys: string[] = Object.keys(this._requiredSpatialArea);

        for (let spatialNodeKey of spatialNodeKeys) {
            delete this._requiredSpatialArea[spatialNodeKey];
        }

        let cachedKeys: string[] = Object.keys(this._cachedSpatialEdges);

        for (let cachedKey of cachedKeys) {
            let node: Node = this._cachedSpatialEdges[cachedKey];
            node.resetSpatialEdges();

            delete this._cachedSpatialEdges[cachedKey];
        }
    }

    private _cacheSequence$(sequenceKey: string): Observable<Graph> {
        if (sequenceKey in this._cachingSequences$) {
            return this._cachingSequences$[sequenceKey];
        }

        this._cachingSequences$[sequenceKey] = this._apiV3.sequenceByKey$([sequenceKey])
            .do(
                (sequenceByKey: { [sequenceKey: string]: ISequence }): void => {
                    if (!(sequenceKey in this._sequences)) {
                        this._sequences[sequenceKey] = new Sequence(sequenceByKey[sequenceKey]);
                    }

                    delete this._cachingSequences$[sequenceKey];
                })
            .map<Graph>(
                (sequenceByKey: { [sequenceKey: string]: ISequence }): Graph => {
                    return this;
                })
            .finally(
                (): void => {
                    if (sequenceKey in this._cachingSequences$) {
                        delete this._cachingSequences$[sequenceKey];
                    }

                    this._changed$.next(this);
                })
            .publish()
            .refCount();

        return this._cachingSequences$[sequenceKey];
    }

    private _makeFull(node: Node, fillNode: IFillNode): void {
        if (fillNode.calt == null) {
            fillNode.calt = this._defaultAlt;
        }

        if (fillNode.c_rotation == null) {
            fillNode.c_rotation = this._graphCalculator.rotationFromCompass(fillNode.ca, fillNode.orientation);
        }

        node.makeFull(fillNode);
    }

    private _preStore(h: string, node: Node): void {
        if (!(h in this._preStored)) {
            this._preStored[h] = {};
        }

        this._preStored[h][node.key] = node;
    }

    private _removeFromPreStore(h: string): { [key: string]: Node } {
        let preStored: { [key: string]: Node } = null;

        if (h in this._preStored) {
            preStored = this._preStored[h];
            delete this._preStored[h];
        }

        return preStored;
    }

    private _setNode(node: Node): void {
        let key: string = node.key;

        if (this.hasNode(key)) {
            throw new GraphMapillaryError(`Node already exist (${key}).`);
        }

        this._nodes[key] = node;
    }
}

export default Graph;
