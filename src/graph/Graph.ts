import {
    concat as observableConcat,
    from as observableFrom,
    merge as observableMerge,
    of as observableOf,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    tap,
    refCount,
    catchError,
    publish,
    finalize,
    map,
    reduce,
    mergeMap,
    mergeAll,
    last,
    publishReplay,
} from "rxjs/operators";

import {
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
import { GraphMapillaryError } from "../Error";
import {
    FilterCreator,
    FilterExpression,
    FilterFunction,
    IGraphConfiguration,
    Node,
    NodeCache,
    Sequence,
    GraphCalculator,
} from "../Graph";
import { GeoRBush } from "../Geo";
import API from "../api/API";
import { IDataProvider } from "../api/interfaces/interfaces";

type NodeIndexItem = {
    lat: number;
    lon: number;
    node: Node;
};

type NodeTiles = {
    cache: string[];
    caching: string[];
};

type SpatialArea = {
    all: { [key: string]: Node };
    cacheKeys: string[];
    cacheNodes: { [key: string]: Node };
};

type NodeAccess = {
    node: Node;
    accessed: number;
};

type TileAccess = {
    nodes: Node[];
    accessed: number;
};

type SequenceAccess = {
    sequence: Sequence;
    accessed: number;
};

/**
 * @class Graph
 *
 * @classdesc Represents a graph of nodes with edges.
 */
export class Graph {
    private _api: API;

    /**
     * Nodes that have initialized cache with a timestamp of last access.
     */
    private _cachedNodes: { [key: string]: NodeAccess };

    /**
     * Nodes for which the required tiles are cached.
     */
    private _cachedNodeTiles: { [key: string]: boolean };

    /**
     * Sequences for which the nodes are cached.
     */
    private _cachedSequenceNodes: { [sequenceKey: string]: boolean };

    /**
     * Nodes for which the spatial edges are cached.
     */
    private _cachedSpatialEdges: { [key: string]: Node };

    /**
     * Cached tiles with a timestamp of last access.
     */
    private _cachedTiles: { [h: string]: TileAccess };

    /**
     * Nodes for which fill properties are being retreived.
     */
    private _cachingFill$: { [key: string]: Observable<Graph> };

    /**
     * Nodes for which full properties are being retrieved.
     */
    private _cachingFull$: { [key: string]: Observable<Graph> };

    /**
     * Sequences for which the nodes are being retrieved.
     */
    private _cachingSequenceNodes$: { [sequenceKey: string]: Observable<Graph> };

    /**
     * Sequences that are being retrieved.
     */
    private _cachingSequences$: { [sequenceKey: string]: Observable<Graph> };

    /**
     * Nodes for which the spatial area fill properties are being retrieved.
     */
    private _cachingSpatialArea$: { [key: string]: Observable<Graph>[] };

    /**
     * Tiles that are being retrieved.
     */
    private _cachingTiles$: { [h: string]: Observable<Graph> };

    private _changed$: Subject<Graph>;

    private _defaultAlt: number;
    private _edgeCalculator: EdgeCalculator;
    private _graphCalculator: GraphCalculator;
    private _configuration: IGraphConfiguration;

    private _filter: FilterFunction;
    private _filterCreator: FilterCreator;
    private _filterSubject$: Subject<FilterFunction>;
    private _filter$: Observable<FilterFunction>;
    private _filterSubscription: Subscription;

    /**
     * All nodes in the graph.
     */
    private _nodes: { [key: string]: Node };

    /**
     * Contains all nodes in the graph. Used for fast spatial lookups.
     */
    private _nodeIndex: GeoRBush<NodeIndexItem>;

    /**
     * All node index items sorted in tiles for easy uncache.
     */
    private _nodeIndexTiles: { [h: string]: NodeIndexItem[] };

    /**
     * Node to tile dictionary for easy tile access updates.
     */
    private _nodeToTile: { [key: string]: string };

    /**
     * Nodes retrieved before tiles, stored on tile level.
     */
    private _preStored: { [h: string]: { [key: string]: Node } };

    /**
     * Tiles required for a node to retrive spatial area.
     */
    private _requiredNodeTiles: { [key: string]: NodeTiles };

    /**
     * Other nodes required for node to calculate spatial edges.
     */
    private _requiredSpatialArea: { [key: string]: SpatialArea };

    /**
     * All sequences in graph with a timestamp of last access.
     */
    private _sequences: { [skey: string]: SequenceAccess };

    private _tileThreshold: number;

    /**
     * Create a new graph instance.
     *
     * @param {API} [api] - API instance for retrieving data.
     * @param {rbush.RBush<NodeIndexItem>} [nodeIndex] - Node index for fast spatial retreival.
     * @param {GraphCalculator} [graphCalculator] - Instance for graph calculations.
     * @param {EdgeCalculator} [edgeCalculator] - Instance for edge calculations.
     * @param {FilterCreator} [filterCreator] - Instance for  filter creation.
     * @param {IGraphConfiguration} [configuration] - Configuration struct.
     */
    constructor(
        api: API,
        nodeIndex?: GeoRBush<NodeIndexItem>,
        graphCalculator?: GraphCalculator,
        edgeCalculator?: EdgeCalculator,
        filterCreator?: FilterCreator,
        configuration?: IGraphConfiguration) {

        this._api = api;

        this._cachedNodes = {};
        this._cachedNodeTiles = {};
        this._cachedSequenceNodes = {};
        this._cachedSpatialEdges = {};
        this._cachedTiles = {};

        this._cachingFill$ = {};
        this._cachingFull$ = {};
        this._cachingSequenceNodes$ = {};
        this._cachingSequences$ = {};
        this._cachingSpatialArea$ = {};
        this._cachingTiles$ = {};

        this._changed$ = new Subject<Graph>();

        this._filterCreator = filterCreator != null ? filterCreator : new FilterCreator();
        this._filter = this._filterCreator.createFilter(undefined);
        this._filterSubject$ = new Subject<FilterFunction>();
        this._filter$ =
            observableConcat(
                observableOf(this._filter),
                this._filterSubject$).pipe(
                    publishReplay(1),
                    refCount());
        this._filterSubscription = this._filter$.subscribe(() => { /*noop*/ });

        this._defaultAlt = 2;
        this._edgeCalculator = edgeCalculator != null ? edgeCalculator : new EdgeCalculator();
        this._graphCalculator = graphCalculator != null ? graphCalculator : new GraphCalculator();
        this._configuration = configuration != null ?
            configuration :
            {
                maxSequences: 50,
                maxUnusedNodes: 100,
                maxUnusedPreStoredNodes: 30,
                maxUnusedTiles: 20,
            };

        this._nodes = {};
        this._nodeIndex = nodeIndex != null ? nodeIndex : new GeoRBush<NodeIndexItem>(16);
        this._nodeIndexTiles = {};
        this._nodeToTile = {};

        this._preStored = {};

        this._requiredNodeTiles = {};
        this._requiredSpatialArea = {};

        this._sequences = {};
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
     * Get filter$.
     *
     * @returns {Observable<FilterFunction>} Observable emitting
     * the filter every time it has changed.
     */
    public get filter$(): Observable<FilterFunction> {
        return this._filter$;
    }

    /**
     * Caches the full node data for all images within a bounding
     * box.
     *
     * @description The node assets are not cached.
     *
     * @param {ILatLon} sw - South west corner of bounding box.
     * @param {ILatLon} ne - North east corner of bounding box.
     * @returns {Observable<Graph>} Observable emitting the full
     * nodes in the bounding box.
     */
    public cacheBoundingBox$(sw: ILatLon, ne: ILatLon): Observable<Node[]> {
        const cacheTiles$: Observable<Graph>[] = this._api.data.geometry.bboxToCellIds(sw, ne)
            .filter(
                (h: string): boolean => {
                    return !(h in this._cachedTiles);
                })
            .map(
                (h): Observable<Graph> => {
                    return h in this._cachingTiles$ ?
                        this._cachingTiles$[h] :
                        this._cacheTile$(h);
                });

        if (cacheTiles$.length === 0) {
            cacheTiles$.push(observableOf(this));
        }

        return observableFrom(cacheTiles$).pipe(
            mergeAll(),
            last(),
            mergeMap(
                (graph: Graph): Observable<Node[]> => {
                    const nodes: Node[] = this._nodeIndex
                        .search({
                            maxX: ne.lat,
                            maxY: ne.lon,
                            minX: sw.lat,
                            minY: sw.lon,
                        })
                        .map(
                            (item: NodeIndexItem): Node => {
                                return item.node;
                            });

                    const fullNodes: Node[] = [];
                    const coreNodes: string[] = [];

                    for (const node of nodes) {
                        if (node.full) {
                            fullNodes.push(node);
                        } else {
                            coreNodes.push(node.key);
                        }
                    }

                    const coreNodeBatches: string[][] = [];
                    const batchSize: number = 200;
                    while (coreNodes.length > 0) {
                        coreNodeBatches.push(coreNodes.splice(0, batchSize));
                    }

                    const fullNodes$: Observable<Node[]> = observableOf(fullNodes);
                    const fillNodes$: Observable<Node[]>[] = coreNodeBatches
                        .map(
                            (batch: string[]): Observable<Node[]> => {
                                return this._api.imageByKeyFill$(batch).pipe(
                                    map(
                                        (imageByKeyFill: { [key: string]: IFillNode }): Node[] => {
                                            const filledNodes: Node[] = [];

                                            for (const fillKey in imageByKeyFill) {
                                                if (!imageByKeyFill.hasOwnProperty(fillKey)) {
                                                    continue;
                                                }

                                                if (this.hasNode(fillKey)) {
                                                    const node: Node = this.getNode(fillKey);

                                                    if (!node.full) {
                                                        this._makeFull(node, imageByKeyFill[fillKey]);
                                                    }

                                                    filledNodes.push(node);
                                                }
                                            }

                                            return filledNodes;
                                        }));
                            });

                    return observableMerge(
                        fullNodes$,
                        observableFrom(fillNodes$).pipe(
                            mergeAll()));
                }),
            reduce(
                (acc: Node[], value: Node[]): Node[] => {
                    return acc.concat(value);
                }));
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

        this._cachingFill$[key] = this._api.imageByKeyFill$([key]).pipe(
            tap(
                (imageByKeyFill: { [key: string]: IFillNode }): void => {
                    if (!node.full) {
                        this._makeFull(node, imageByKeyFill[key]);
                    }

                    delete this._cachingFill$[key];
                }),
            map(
                (imageByKeyFill: { [key: string]: IFillNode }): Graph => {
                    return this;
                }),
            finalize(
                (): void => {
                    if (key in this._cachingFill$) {
                        delete this._cachingFill$[key];
                    }

                    this._changed$.next(this);
                }),
            publish(),
            refCount());

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

        this._cachingFull$[key] = this._api.imageByKeyFull$([key]).pipe(
            tap(
                (imageByKeyFull: { [key: string]: IFullNode }): void => {
                    let fn: IFullNode = imageByKeyFull[key];

                    if (this.hasNode(key)) {
                        let node: Node = this.getNode(key);

                        if (!node.full) {
                            this._makeFull(node, fn);
                        }
                    } else {
                        if (fn.sequence_key == null) {
                            throw new GraphMapillaryError(`Node has no sequence key (${key}).`);
                        }

                        let node: Node = new Node(fn);
                        this._makeFull(node, fn);

                        let h: string = this._api.data.geometry.latLonToCellId(node.originalLatLon);
                        this._preStore(h, node);
                        this._setNode(node);

                        delete this._cachingFull$[key];
                    }
                }),
            map(
                (imageByKeyFull: { [key: string]: IFullNode }): Graph => {
                    return this;
                }),
            finalize(
                (): void => {
                    if (key in this._cachingFull$) {
                        delete this._cachingFull$[key];
                    }

                    this._changed$.next(this);
                }),
            publish(),
            refCount());

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

        let sequence: Sequence = this._sequences[node.sequenceKey].sequence;
        let edges: IEdge[] = this._edgeCalculator.computeSequenceEdges(node, sequence);

        node.cacheSequenceEdges(edges);
    }

    /**
     * Retrieve and cache full nodes for all keys in a sequence.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @param {string} referenceNodeKey - Key of node to use as reference
     * for optimized caching.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the nodes of the sequence has been cached.
     */
    public cacheSequenceNodes$(sequenceKey: string, referenceNodeKey?: string): Observable<Graph> {
        if (!this.hasSequence(sequenceKey)) {
            throw new GraphMapillaryError(
                `Cannot cache sequence nodes of sequence that does not exist in graph (${sequenceKey}).`);
        }

        if (this.hasSequenceNodes(sequenceKey)) {
            throw new GraphMapillaryError(`Sequence nodes already cached (${sequenceKey}).`);
        }

        const sequence: Sequence = this.getSequence(sequenceKey);
        if (sequence.key in this._cachingSequenceNodes$) {
            return this._cachingSequenceNodes$[sequence.key];
        }

        const batches: string[][] = [];
        const keys: string[] = sequence.keys.slice();

        const referenceBatchSize: number = 50;
        if (!!referenceNodeKey && keys.length > referenceBatchSize) {
            const referenceIndex: number = keys.indexOf(referenceNodeKey);
            const startIndex: number = Math.max(
                0,
                Math.min(
                    referenceIndex - referenceBatchSize / 2,
                    keys.length - referenceBatchSize));

            batches.push(keys.splice(startIndex, referenceBatchSize));
        }

        const batchSize: number = 200;
        while (keys.length > 0) {
            batches.push(keys.splice(0, batchSize));
        }

        let batchesToCache: number = batches.length;
        const sequenceNodes$: Observable<Graph> = observableFrom(batches).pipe(
            mergeMap(
                (batch: string[]): Observable<Graph> => {
                    return this._api.imageByKeyFull$(batch).pipe(
                        tap(
                            (imageByKeyFull: { [key: string]: IFullNode }): void => {
                                for (const fullKey in imageByKeyFull) {
                                    if (!imageByKeyFull.hasOwnProperty(fullKey)) {
                                        continue;
                                    }

                                    const fn: IFullNode = imageByKeyFull[fullKey];

                                    if (this.hasNode(fullKey)) {
                                        const node: Node = this.getNode(fn.key);

                                        if (!node.full) {
                                            this._makeFull(node, fn);
                                        }
                                    } else {
                                        if (fn.sequence_key == null) {
                                            console.warn(`Sequence missing, discarding node (${fn.key})`);
                                        }

                                        const node: Node = new Node(fn);
                                        this._makeFull(node, fn);

                                        const h: string = this._api.data.geometry.latLonToCellId(node.originalLatLon);
                                        this._preStore(h, node);
                                        this._setNode(node);
                                    }
                                }

                                batchesToCache--;
                            }),
                        map(
                            (imageByKeyFull: { [key: string]: IFullNode }): Graph => {
                                return this;
                            }));
                },
                6),
            last(),
            finalize(
                (): void => {
                    delete this._cachingSequenceNodes$[sequence.key];

                    if (batchesToCache === 0) {
                        this._cachedSequenceNodes[sequence.key] = true;
                    }
                }),
            publish(),
            refCount());

        this._cachingSequenceNodes$[sequence.key] = sequenceNodes$;

        return sequenceNodes$;
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
            let spatialNodeBatch$: Observable<Graph> = this._api.imageByKeyFill$(batch).pipe(
                tap(
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
                    }),
                map(
                    (imageByKeyFill: { [key: string]: IFillNode }): Graph => {
                        return this;
                    }),
                catchError(
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
                    }),
                finalize(
                    (): void => {
                        if (Object.keys(spatialArea.cacheNodes).length === 0) {
                            this._changed$.next(this);
                        }
                    }),
                publish(),
                refCount());

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
        let sequence: Sequence = this._sequences[node.sequenceKey].sequence;

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
        delete this._cachedNodeTiles[key];
    }

    /**
     * Retrieve and cache tiles for a node.
     *
     * @param {string} key - Key of node for which to retrieve tiles.
     * @returns {Array<Observable<Graph>>} Array of observables emitting
     * the graph for each tile required for the node has been cached.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    public cacheTiles$(key: string): Observable<Graph>[] {
        if (key in this._cachedNodeTiles) {
            throw new GraphMapillaryError(`Tiles already cached (${key}).`);
        }

        if (key in this._cachedSpatialEdges) {
            throw new GraphMapillaryError(`Spatial edges already cached so tiles considered cached (${key}).`);
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
            const cacheTile$: Observable<Graph> = h in this._cachingTiles$ ?
                this._cachingTiles$[h] :
                this._cacheTile$(h);

            cacheTiles$.push(
                cacheTile$.pipe(
                    tap(
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
                        }),
                    catchError(
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
                        }),
                    finalize(
                        (): void => {
                            this._changed$.next(this);
                        }),
                    publish(),
                    refCount()));
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

        const node: Node = this.getNode(key);
        const provider: IDataProvider = this._api.data;
        node.initializeCache(new NodeCache(provider));

        const accessed: number = new Date().getTime();
        this._cachedNodes[key] = { accessed: accessed, node: node };

        this._updateCachedTileAccess(key, accessed);
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
     * Get a value indicating if the graph is caching sequence nodes.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if the sequence nodes are
     * being cached.
     */
    public isCachingSequenceNodes(sequenceKey: string): boolean {
        return sequenceKey in this._cachingSequenceNodes$;
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
        let accessed: number = new Date().getTime();

        this._updateCachedNodeAccess(key, accessed);
        this._updateCachedTileAccess(key, accessed);

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
        let sequenceKey: string = node.sequenceKey;

        let hasNodeSequence: boolean = sequenceKey in this._sequences;

        if (hasNodeSequence) {
            this._sequences[sequenceKey].accessed = new Date().getTime();
        }

        return hasNodeSequence;
    }

    /**
     * Get a value indicating if a sequence exist in the graph.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if a sequence exist
     * in the graph.
     */
    public hasSequence(sequenceKey: string): boolean {
        let hasSequence: boolean = sequenceKey in this._sequences;

        if (hasSequence) {
            this._sequences[sequenceKey].accessed = new Date().getTime();
        }

        return hasSequence;
    }

    /**
     * Get a value indicating if sequence nodes has been cached in the graph.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if a sequence nodes has been
     * cached in the graph.
     */
    public hasSequenceNodes(sequenceKey: string): boolean {
        return sequenceKey in this._cachedSequenceNodes;
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
            maxX: bbox[1].lat,
            maxY: bbox[1].lon,
            minX: bbox[0].lat,
            minY: bbox[0].lon,
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

        if (key in this._cachedSpatialEdges) {
            return true;
        }

        if (!this.hasNode(key)) {
            throw new GraphMapillaryError(`Node does not exist in graph (${key}).`);
        }

        let nodeTiles: NodeTiles = { cache: [], caching: [] };

        if (!(key in this._requiredNodeTiles)) {
            let node: Node = this.getNode(key);
            nodeTiles.cache = this._api.data.geometry
                .latLonToCellIds(
                    node.latLon,
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

        this._updateCachedNodeAccess(key, accessed);
        this._updateCachedTileAccess(key, accessed);

        return this._nodes[key];
    }

    /**
     * Get a sequence.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {Node} Retrieved sequence.
     */
    public getSequence(sequenceKey: string): Sequence {
        let sequenceAccess: SequenceAccess = this._sequences[sequenceKey];
        sequenceAccess.accessed = new Date().getTime();

        return sequenceAccess.sequence;
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

            const h: string = this._api.data.geometry.latLonToCellId(node.originalLatLon);
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
     * @emits FilterFunction The filter function to the Graph#filter$
     * observable.
     *
     * @param {FilterExpression} filter - Filter expression to be applied
     * when calculating spatial edges.
     */
    public setFilter(filter: FilterExpression): void {
        this._filter = this._filterCreator.createFilter(filter);
        this._filterSubject$.next(this._filter);
    }

    /**
     * Uncache the graph according to the graph configuration.
     *
     * @description Uncaches unused tiles, unused nodes and
     * sequences according to the numbers specified in the
     * graph configuration. Sequences does not have a direct
     * reference to either tiles or nodes and may be uncached
     * even if they are related to the nodes that should be kept.
     *
     * @param {Array<string>} keepKeys - Keys of nodes to keep in
     * graph unrelated to last access. Tiles related to those keys
     * will also be kept in graph.
     * @param {string} keepSequenceKey - Optional key of sequence
     * for which the belonging nodes should not be disposed or
     * removed from the graph. These nodes may still be uncached if
     * not specified in keep keys param.
     */
    public uncache(keepKeys: string[], keepSequenceKey?: string): void {
        let keysInUse: { [key: string]: boolean } = {};

        this._addNewKeys(keysInUse, this._cachingFull$);
        this._addNewKeys(keysInUse, this._cachingFill$);
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

            let nodeHs: string[] = this._api.data.geometry
                .latLonToCellIds(node.latLon, this._tileThreshold);

            for (let nodeH of nodeHs) {
                if (!(nodeH in keepHs)) {
                    keepHs[nodeH] = true;
                }
            }
        }

        let potentialHs: [string, TileAccess][] = [];
        for (let h in this._cachedTiles) {
            if (!this._cachedTiles.hasOwnProperty(h) || h in keepHs) {
                continue;
            }

            potentialHs.push([h, this._cachedTiles[h]]);
        }

        let uncacheHs: string[] = potentialHs
            .sort(
                (h1: [string, TileAccess], h2: [string, TileAccess]): number => {
                    return h2[1].accessed - h1[1].accessed;
                })
            .slice(this._configuration.maxUnusedTiles)
            .map(
                (h: [string, TileAccess]): string => {
                    return h[0];
                });

        for (let uncacheH of uncacheHs) {
            this._uncacheTile(uncacheH, keepSequenceKey);
        }

        let potentialPreStored: [NodeAccess, string][] = [];
        let nonCachedPreStored: [string, string][] = [];
        for (let h in this._preStored) {
            if (!this._preStored.hasOwnProperty(h) || h in this._cachingTiles$) {
                continue;
            }

            const prestoredNodes: { [key: string]: Node } = this._preStored[h];

            for (let key in prestoredNodes) {
                if (!prestoredNodes.hasOwnProperty(key) || key in keysInUse) {
                    continue;
                }

                if (prestoredNodes[key].sequenceKey === keepSequenceKey) {
                    continue;
                }

                if (key in this._cachedNodes) {
                    potentialPreStored.push([this._cachedNodes[key], h]);
                } else {
                    nonCachedPreStored.push([key, h]);
                }
            }
        }

        let uncachePreStored: [string, string][] = potentialPreStored
            .sort(
                ([na1, h1]: [NodeAccess, string], [na2, h2]: [NodeAccess, string]): number => {
                    return na2.accessed - na1.accessed;
                })
            .slice(this._configuration.maxUnusedPreStoredNodes)
            .map(
                ([na, h]: [NodeAccess, string]): [string, string] => {
                    return [na.node.key, h];
                });

        this._uncachePreStored(nonCachedPreStored);
        this._uncachePreStored(uncachePreStored);

        let potentialNodes: NodeAccess[] = [];
        for (let key in this._cachedNodes) {
            if (!this._cachedNodes.hasOwnProperty(key) || key in keysInUse) {
                continue;
            }

            potentialNodes.push(this._cachedNodes[key]);
        }

        let uncacheNodes: NodeAccess[] = potentialNodes
            .sort(
                (n1: NodeAccess, n2: NodeAccess): number => {
                    return n2.accessed - n1.accessed;
                })
            .slice(this._configuration.maxUnusedNodes);

        for (let nodeAccess of uncacheNodes) {
            nodeAccess.node.uncache();
            let key: string = nodeAccess.node.key;
            delete this._cachedNodes[key];

            if (key in this._cachedNodeTiles) {
                delete this._cachedNodeTiles[key];
            }

            if (key in this._cachedSpatialEdges) {
                delete this._cachedSpatialEdges[key];
            }
        }

        let potentialSequences: SequenceAccess[] = [];
        for (let sequenceKey in this._sequences) {
            if (!this._sequences.hasOwnProperty(sequenceKey) ||
                sequenceKey in this._cachingSequences$ ||
                sequenceKey === keepSequenceKey) {
                continue;
            }

            potentialSequences.push(this._sequences[sequenceKey]);
        }

        let uncacheSequences: SequenceAccess[] = potentialSequences
            .sort(
                (s1: SequenceAccess, s2: SequenceAccess): number => {
                    return s2.accessed - s1.accessed;
                })
            .slice(this._configuration.maxSequences);

        for (let sequenceAccess of uncacheSequences) {
            let sequenceKey: string = sequenceAccess.sequence.key;

            delete this._sequences[sequenceKey];

            if (sequenceKey in this._cachedSequenceNodes) {
                delete this._cachedSequenceNodes[sequenceKey];
            }

            sequenceAccess.sequence.dispose();
        }
    }

    /**
     * Unsubscribes all subscriptions.
     *
     * @description Afterwards, you must not call any other methods
     * on the graph instance.
     */
    public unsubscribe(): void {
        this._filterSubscription.unsubscribe();
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

        this._cachingSequences$[sequenceKey] = this._api.sequenceByKey$([sequenceKey]).pipe(
            tap(
                (sequenceByKey: { [sequenceKey: string]: ISequence }): void => {
                    if (!(sequenceKey in this._sequences)) {
                        this._sequences[sequenceKey] = {
                            accessed: new Date().getTime(),
                            sequence: new Sequence(sequenceByKey[sequenceKey]),
                        };
                    }

                    delete this._cachingSequences$[sequenceKey];
                }),
            map(
                (sequenceByKey: { [sequenceKey: string]: ISequence }): Graph => {
                    return this;
                }),
            finalize(
                (): void => {
                    if (sequenceKey in this._cachingSequences$) {
                        delete this._cachingSequences$[sequenceKey];
                    }

                    this._changed$.next(this);
                }),
            publish(),
            refCount());

        return this._cachingSequences$[sequenceKey];
    }

    private _cacheTile$(h: string): Observable<Graph> {
        this._cachingTiles$[h] = this._api.imagesByH$(h).pipe(
            tap(
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

                        if (coreNode.sequence_key == null) {
                            console.warn(`Sequence missing, discarding node (${coreNode.key})`);

                            continue;
                        }

                        if (preStored != null && coreNode.key in preStored) {
                            let preStoredNode: Node = preStored[coreNode.key];
                            delete preStored[coreNode.key];

                            hCache.push(preStoredNode);

                            let preStoredNodeIndexItem: NodeIndexItem = {
                                lat: preStoredNode.latLon.lat,
                                lon: preStoredNode.latLon.lon,
                                node: preStoredNode,
                            };

                            this._nodeIndex.insert(preStoredNodeIndexItem);
                            this._nodeIndexTiles[h].push(preStoredNodeIndexItem);
                            this._nodeToTile[preStoredNode.key] = h;

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
                }),
            map(
                (imagesByH: { [key: string]: { [index: string]: ICoreNode } }): Graph => {
                    return this;
                }),
            catchError(
                (error: Error): Observable<Graph> => {
                    delete this._cachingTiles$[h];

                    throw error;
                }),
            publish(),
            refCount());

        return this._cachingTiles$[h];
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

    private _uncacheTile(h: string, keepSequenceKey: string): void {
        for (let node of this._cachedTiles[h].nodes) {
            let key: string = node.key;

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

            if (node.sequenceKey === keepSequenceKey) {
                this._preStore(h, node);
                node.uncache();
            } else {
                delete this._nodes[key];

                if (node.sequenceKey in this._cachedSequenceNodes) {
                    delete this._cachedSequenceNodes[node.sequenceKey];
                }

                node.dispose();
            }
        }

        for (let nodeIndexItem of this._nodeIndexTiles[h]) {
            this._nodeIndex.remove(nodeIndexItem);
        }

        delete this._nodeIndexTiles[h];
        delete this._cachedTiles[h];
    }

    private _uncachePreStored(preStored: [string, string][]): void {
        let hs: { [h: string]: boolean } = {};
        for (let [key, h] of preStored) {
            if (key in this._nodes) {
                delete this._nodes[key];
            }

            if (key in this._cachedNodes) {
                delete this._cachedNodes[key];
            }

            let node: Node = this._preStored[h][key];

            if (node.sequenceKey in this._cachedSequenceNodes) {
                delete this._cachedSequenceNodes[node.sequenceKey];
            }

            delete this._preStored[h][key];

            node.dispose();

            hs[h] = true;
        }

        for (let h in hs) {
            if (!hs.hasOwnProperty(h)) {
                continue;
            }

            if (Object.keys(this._preStored[h]).length === 0) {
                delete this._preStored[h];
            }
        }
    }

    private _updateCachedTileAccess(key: string, accessed: number): void {
        if (key in this._nodeToTile) {
            this._cachedTiles[this._nodeToTile[key]].accessed = accessed;
        }
    }

    private _updateCachedNodeAccess(key: string, accessed: number): void {
        if (key in this._cachedNodes) {
            this._cachedNodes[key].accessed = accessed;
        }
    }
}

export default Graph;
