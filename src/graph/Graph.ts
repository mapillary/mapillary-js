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
    ILatLon,
    ISequence,
} from "../API";
import {
    IEdge,
    IPotentialEdge,
    EdgeCalculator,
} from "../Edge";
import {GraphMapillaryError} from "../Error";
import {
    FilterCreator,
    FilterExpression,
    FilterFunction,
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

type NodeAccess = {
    node: Node;
    accessed: number;
}

type TileAccess = {
    nodes: Node[];
    accessed: number;
}

/**
 * @class Graph
 *
 * @classdesc Represents a graph of nodes with edges.
 */
export class Graph {
    private _apiV3: APIv3;

    private _cachedNodes: { [key: string]: NodeAccess };
    private _cachedNodeTiles: { [key: string]: boolean };
    private _cachedSpatialEdges: { [key: string]: Node };
    private _cachedTiles: { [h: string]: TileAccess };

    private _cachingFill$: { [key: string]: Observable<Graph> };
    private _cachingFull$: { [key: string]: Observable<Graph> };
    private _cachingSequences$: { [sequenceKey: string]: Observable<Graph> };
    private _cachingSpatialArea$: { [key: string]: Observable<Graph>[] };
    private _cachingTiles$: { [h: string]: Observable<Graph> };

    private _changed$: Subject<Graph>;

    private _defaultAlt: number;
    private _edgeCalculator: EdgeCalculator;
    private _filter: FilterFunction;
    private _filterCreator: FilterCreator;
    private _graphCalculator: GraphCalculator;

    private _nodes: { [key: string]: Node };
    private _nodeIndex: rbush.RBush<NodeIndexItem>;
    private _nodeIndexTiles: { [h: string]: NodeIndexItem[] };
    private _nodeToTile: { [key: string]: string };

    private _preStored: { [h: string]:  { [key: string]: Node }; };

    private _requiredNodeTiles: { [key: string]: NodeTiles };
    private _requiredSpatialArea: { [key: string]: SpatialArea };

    private _sequences: { [skey: string]: Sequence };

    private _tilePrecision: number;
    private _tileThreshold: number;

    /**
     * Create a new graph instance.
     *
     * @param {APIv3} [apiV3] - API instance for retrieving data.
     * @param {rbush.RBush<NodeIndexItem>} [nodeIndex] - Node index for fast spatial retreival.
     * @param {GraphCalculator} [graphCalculator] - Instance for graph calculations.
     * @param {EdgeCalculator} [edgeCalculator] - Instance for edge calculations.
     */
    constructor(
        apiV3: APIv3,
        nodeIndex?: rbush.RBush<NodeIndexItem>,
        graphCalculator?: GraphCalculator,
        edgeCalculator?: EdgeCalculator,
        filterCreator?: FilterCreator) {

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
        this._filterCreator = filterCreator != null ? filterCreator : new FilterCreator();
        this._filter = this._filterCreator.createFilter(undefined);
        this._graphCalculator = graphCalculator != null ? graphCalculator : new GraphCalculator();

        this._nodes = {};
        this._nodeIndex = nodeIndex != null ? nodeIndex : rbush<NodeIndexItem>(16, [".lon", ".lat", ".lon", ".lat"]);
        this._nodeIndexTiles = {};
        this._nodeToTile = {};

        this._preStored = {};

        this._requiredNodeTiles = {};
        this._requiredSpatialArea = {};

        this._sequences = {};

        this._tilePrecision = 7;
        this._tileThreshold = 20;
    }

    /**
     * Get changed$.
     *
     * @returns {Observable<Graph>} Observable emitting
     * the graph every time it has changed.
     */
    public get changed$(): Observable<Graph> {
        return this._changed$;
    }

    /**
     * Retrieve and cache node fill properties.
     *
     * @param {string} key - Key of node to fill.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the node has been updated.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
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
            .map(
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

    /**
     * Retrieve and cache full node properties.
     *
     * @param {string} key - Key of node to fill.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the node has been updated.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
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
            .map(
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

    /**
     * Retrieve and cache a node sequence.
     *
     * @param {string} key - Key of node for which to retrieve sequence.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the sequence has been retrieved.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
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

    /**
     * Retrieve and cache a sequence.
     *
     * @param {string} sequenceKey - Key of sequence to cache.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the sequence has been retrieved.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    public cacheSequence$(sequenceKey: string): Observable<Graph> {
        if (sequenceKey in this._sequences) {
            throw new GraphMapillaryError(`Sequence already cached (${sequenceKey})`);
        }

        return this._cacheSequence$(sequenceKey);
    }

    /**
     * Cache sequence edges for a node.
     *
     * @param {string} key - Key of node.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    public cacheSequenceEdges(key: string): void {
        let node: Node = this.getNode(key);

        if (!(node.sequenceKey in this._sequences)) {
            throw new GraphMapillaryError(`Sequence is not cached (${key}), (${node.sequenceKey})`);
        }

        let sequence: Sequence = this._sequences[node.sequenceKey];
        let edges: IEdge[] = this._edgeCalculator.computeSequenceEdges(node, sequence);

        node.cacheSequenceEdges(edges);
    }

    /**
     * Retrieve and cache full nodes for a node spatial area.
     *
     * @param {string} key - Key of node for which to retrieve sequence.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the nodes in the spatial area has been made full.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
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
                .map(
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

    /**
     * Cache spatial edges for a node.
     *
     * @param {string} key - Key of node.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    public cacheSpatialEdges(key: string): void {
        if (key in this._cachedSpatialEdges) {
             throw new GraphMapillaryError(`Spatial edges already cached (${key}).`);
        }

        let node: Node = this.getNode(key);
        let sequence: Sequence = this._sequences[node.sequenceKey];

        let fallbackKeys: string[] = [];
        let prevKey: string = sequence.findPrevKey(node.key);
        if (prevKey != null) {
            fallbackKeys.push(prevKey);
        }

        let nextKey: string = sequence.findNextKey(node.key);
        if (nextKey != null) {
            fallbackKeys.push(nextKey);
        }

        let allSpatialNodes: { [key: string]: Node } = this._requiredSpatialArea[key].all;
        let potentialNodes: Node[] = [];
        let filter: FilterFunction = this._filter;
        for (let spatialNodeKey in allSpatialNodes) {
            if (!allSpatialNodes.hasOwnProperty(spatialNodeKey)) {
                continue;
            }

            let spatialNode: Node = allSpatialNodes[spatialNodeKey];

            if (filter(spatialNode)) {
                potentialNodes.push(spatialNode);
            }
        }

        let potentialEdges: IPotentialEdge[] =
            this._edgeCalculator.getPotentialEdges(node, potentialNodes, fallbackKeys);

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

    /**
     * Retrieve and cache geohash tiles for a node.
     *
     * @param {string} key - Key of node for which to retrieve tiles.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the tiles required for the node has been cached.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
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

                            this._nodeIndexTiles[h] = [];
                            this._cachedTiles[h] = { accessed: new Date().getTime(), nodes: [] };
                            let hCache: Node[] = this._cachedTiles[h].nodes;
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

                                    let nodeIndexItem: NodeIndexItem = {
                                        lat: node.latLon.lat,
                                        lon: node.latLon.lon,
                                        node: node,
                                    };

                                    this._nodeIndex.insert(nodeIndexItem);
                                    this._nodeIndexTiles[h].push(nodeIndexItem);
                                    this._nodeToTile[node.key] = h;

                                    continue;
                                }

                                let node: Node = new Node(coreNode);

                                hCache.push(node);

                                let nodeIndexItem: NodeIndexItem = {
                                    lat: node.latLon.lat,
                                    lon: node.latLon.lon,
                                    node: node,
                                };

                                this._nodeIndex.insert(nodeIndexItem);
                                this._nodeIndexTiles[h].push(nodeIndexItem);
                                this._nodeToTile[node.key] = h;

                                this._setNode(node);
                            }

                            delete this._cachingTiles$[h];
                        })
                    .map(
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

    /**
     * Initialize the cache for a node.
     *
     * @param {string} key - Key of node.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    public initializeCache(key: string): void {
        if (key in this._cachedNodes) {
            throw new GraphMapillaryError(`Node already in cache (${key}).`);
        }

        let node: Node = this.getNode(key);
        node.initializeCache(new NodeCache());

        let accessed: number = new Date().getTime();
        this._cachedNodes[key] = { accessed: accessed, node: node };

        if (key in this._nodeToTile) {
            this._cachedTiles[this._nodeToTile[key]].accessed = accessed;
        }
    }

    /**
     * Get a value indicating if the graph is fill caching a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the node is being fill cached.
     */
    public isCachingFill(key: string): boolean {
        return key in this._cachingFill$;
    }

    /**
     * Get a value indicating if the graph is fully caching a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the node is being fully cached.
     */
    public isCachingFull(key: string): boolean {
        return key in this._cachingFull$;
    }

    /**
     * Get a value indicating if the graph is caching a sequence of a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the sequence of a node is
     * being cached.
     */
    public isCachingNodeSequence(key: string): boolean {
        let node: Node = this.getNode(key);

        return node.sequenceKey in this._cachingSequences$;
    }

    /**
     * Get a value indicating if the graph is caching a sequence.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if the sequence is
     * being cached.
     */
    public isCachingSequence(sequenceKey: string): boolean {
        return sequenceKey in this._cachingSequences$;
    }

    /**
     * Get a value indicating if the graph is caching the tiles
     * required for calculating spatial edges of a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the tiles of
     * a node are being cached.
     */
    public isCachingTiles(key: string): boolean {
        return key in this._requiredNodeTiles &&
            this._requiredNodeTiles[key].cache.length === 0 &&
            this._requiredNodeTiles[key].caching.length > 0;
    }

    /**
     * Get a value indicating if the cache has been initialized
     * for a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the cache has been
     * initialized for a node.
     */
    public hasInitializedCache(key: string): boolean {
        return key in this._cachedNodes;
    }

    /**
     * Get a value indicating if a node exist in the graph.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if a node exist in the graph.
     */
    public hasNode(key: string): boolean {
        return key in this._nodes;
    }

    /**
     * Get a value indicating if a node sequence exist in the graph.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if a node sequence exist
     * in the graph.
     */
    public hasNodeSequence(key: string): boolean {
        let node: Node = this.getNode(key);

        return node.sequenceKey in this._sequences;
    }

    /**
     * Get a value indicating if a sequence exist in the graph.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if a sequence exist
     * in the graph.
     */
    public hasSequence(sequenceKey: string): boolean {
        return sequenceKey in this._sequences;
    }

    /**
     * Get a value indicating if the graph has fully cached
     * all nodes in the spatial area of a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the spatial area
     * of a node has been cached.
     */
    public hasSpatialArea(key: string): boolean {
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

    /**
     * Get a value indicating if the graph has a tiles required
     * for a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the the tiles required
     * by a node has been cached.
     */
    public hasTiles(key: string): boolean {
        if (key in this._cachedNodeTiles) {
            return true;
        }

        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Node does not exist in graph (${key}).`);
        }

        let nodeTiles: NodeTiles = { cache: [], caching: [] };

        if (!(key in this._requiredNodeTiles)) {
            let node: Node = this.getNode(key);
            nodeTiles.cache = this._graphCalculator
                .encodeHs(
                    node.latLon,
                    this._tilePrecision,
                    this._tileThreshold)
                .filter(
                    (h: string): boolean => {
                        return !(h in this._cachedTiles);
                    });

            if (nodeTiles.cache.length > 0) {
                this._requiredNodeTiles[key] = nodeTiles;
            }
        } else {
            nodeTiles = this._requiredNodeTiles[key];
        }

        return nodeTiles.cache.length === 0 && nodeTiles.caching.length === 0;
    }

    /**
     * Get a node.
     *
     * @param {string} key - Key of node.
     * @returns {Node} Retrieved node.
     */
    public getNode(key: string): Node {
        let accessed: number = new Date().getTime();

        if (key in this._cachedNodes) {
            this._cachedNodes[key].accessed = accessed;
        }

        if (key in this._nodeToTile) {
            this._cachedTiles[this._nodeToTile[key]].accessed = accessed;
        }

        return this._nodes[key];
    }

    /**
     * Get a sequence.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {Node} Retrieved sequence.
     */
    public getSequence(sequenceKey: string): Sequence {
        return this._sequences[sequenceKey];
    }

    /**
     * Reset all spatial edges of the graph nodes.
     */
    public resetSpatialEdges(): void {
        let cachedKeys: string[] = Object.keys(this._cachedSpatialEdges);

        for (let cachedKey of cachedKeys) {
            let node: Node = this._cachedSpatialEdges[cachedKey];
            node.resetSpatialEdges();

            delete this._cachedSpatialEdges[cachedKey];
        }
    }

    /**
     * Reset the complete graph but keep the nodes corresponding
     * to the supplied keys. All other nodes will be disposed.
     *
     * @param {Array<string>} keepKeys - Keys for nodes to keep
     * in graph after reset.
     */
    public reset(keepKeys: string[]): void {
        const nodes: Node[] = [];
        for (const key of keepKeys) {
            if (!this.hasNode(key)) {
                throw new Error(`Node does not exist ${key}`);
            }

            const node: Node = this.getNode(key);
            node.resetSequenceEdges();
            node.resetSpatialEdges();
            nodes.push(node);
        }

        for (let cachedKey of Object.keys(this._cachedNodes)) {
            if (keepKeys.indexOf(cachedKey) !== -1) {
                continue;
            }

            this._cachedNodes[cachedKey].node.dispose();
            delete this._cachedNodes[cachedKey];
        }

        this._cachedNodeTiles = {};
        this._cachedSpatialEdges = {};
        this._cachedTiles = {};

        this._cachingFill$ = {};
        this._cachingFull$ = {};
        this._cachingSequences$ = {};
        this._cachingSpatialArea$ = {};
        this._cachingTiles$ = {};

        this._nodes = {};
        this._nodeToTile = {};

        this._preStored = {};

        for (const node of nodes) {
            this._nodes[node.key] = node;

            const h: string = this._graphCalculator.encodeH(node.originalLatLon, this._tilePrecision);
            this._preStore(h, node);
        }

        this._requiredNodeTiles = {};
        this._requiredSpatialArea = {};

        this._sequences = {};

        this._nodeIndexTiles = {};
        this._nodeIndex.clear();
    }

    /**
     * Set the spatial node filter.
     *
     * @param {FilterExpression} filter - Filter expression to be applied
     * when calculating spatial edges.
     */
    public setFilter(filter: FilterExpression): void {
        this._filter = this._filterCreator.createFilter(filter);
    }

    public uncache(keepKeys: string[]): void {
        let keysInUse: { [key: string]: boolean } = {};

        this._addNewKeys(keysInUse, this._cachingFull$);
        this._addNewKeys(keysInUse, this._cachingFill$);
        this._addNewKeys(keysInUse, this._cachingTiles$);
        this._addNewKeys(keysInUse, this._cachingSpatialArea$);
        this._addNewKeys(keysInUse, this._requiredNodeTiles);
        this._addNewKeys(keysInUse, this._requiredSpatialArea);

        for (let key of keepKeys) {
            if (key in keysInUse) {
                continue;
            }

            keysInUse[key] = true;
        }

        let keepHs: { [h: string]: boolean } = {};
        for (let key in keysInUse) {
            if (!keysInUse.hasOwnProperty(key)) {
                continue;
            }

            let node: Node = this._nodes[key];

            let nodeHs: string[] = this._graphCalculator.encodeHs(node.latLon);
            for (let nodeH of nodeHs) {
                if (!(nodeH in keepHs)) {
                    keepHs[nodeH] = true;
                }
            }
        }

        let potentialHs: [string, TileAccess][] = [];
        for (let h in this._cachedTiles) {
            if (!(h in keepHs)) {
                potentialHs.push([h, this._cachedTiles[h]]);
            }
        }

        potentialHs
            .sort(
                (h1: [string, TileAccess], h2: [string, TileAccess]): number => {
                    return h2[1].accessed - h1[1].accessed;
                });

        let maxUnusedTiles: number = 4;

        let uncacheHs: string[] = potentialHs
            .slice(maxUnusedTiles)
            .map(
                (h: [string, TileAccess]): string => {
                    return h[0];
                });

        for (let uncacheH of uncacheHs) {
            this._uncacheTile(uncacheH);
        }
    }

    private _addNewKeys<T>(keys: { [key: string]: boolean }, dict: { [key: string]: T }): void {
        for (let key in dict) {
            if (!dict.hasOwnProperty(key) || !this.hasNode(key)) {
                continue;
            }

            if (!(key in keys)) {
                keys[key] = true;
            }
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
            .map(
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

    private _uncacheTile(h: string): void {
        for (let node of this._cachedTiles[h].nodes) {
            let key: string = node.key;

            delete this._nodes[key];
            delete this._nodeToTile[key];

            if (key in this._cachedNodes) {
                delete this._cachedNodes[key];
            }

            if (key in this._cachedNodeTiles) {
                delete this._cachedNodeTiles[key];
            }

            if (key in this._cachedSpatialEdges) {
                delete this._cachedSpatialEdges[key];
            }

            node.dispose();
        }

        for (let nodeIndexItem of this._nodeIndexTiles[h]) {
            this._nodeIndex.remove(nodeIndexItem);
        }

        delete this._nodeIndexTiles[h];
        delete this._cachedTiles[h];
    }
}

export default Graph;
