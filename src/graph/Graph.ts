import {
    concat as observableConcat,
    empty as observableEmpty,
    from as observableFrom,
    merge as observableMerge,
    of as observableOf,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    catchError,
    finalize,
    map,
    mergeAll,
    mergeMap,
    last,
    publish,
    publishReplay,
    reduce,
    refCount,
    tap,
} from "rxjs/operators";

import { FilterCreator, FilterFunction } from "./FilterCreator";
import { FilterExpression } from "./FilterExpression";
import { GraphCalculator } from "./GraphCalculator";
import { Image } from "./Image";
import { ImageCache } from "./ImageCache";
import { Sequence } from "./Sequence";
import { GraphConfiguration } from "./interfaces/GraphConfiguration";
import { EdgeCalculator } from "./edge/EdgeCalculator";
import { NavigationEdge } from "./edge/interfaces/NavigationEdge";
import { PotentialEdge } from "./edge/interfaces/PotentialEdge";

import { APIWrapper } from "../api/APIWrapper";
import { SpatialImageEnt } from "../api/ents/SpatialImageEnt";
import { LngLat } from "../api/interfaces/LngLat";
import { GraphMapillaryError } from "../error/GraphMapillaryError";
import { SpatialImagesContract } from "../api/contracts/SpatialImagesContract";
import { ImagesContract } from "../api/contracts/ImagesContract";
import { SequenceContract } from "../api/contracts/SequenceContract";
import { CoreImagesContract } from "../api/contracts/CoreImagesContract";

type NodeTiles = {
    cache: string[];
    caching: string[];
};

type SpatialArea = {
    all: { [key: string]: Image; };
    cacheKeys: string[];
    cacheNodes: { [key: string]: Image; };
};

type NodeAccess = {
    node: Image;
    accessed: number;
};

type TileAccess = {
    nodes: Image[];
    accessed: number;
};

type SequenceAccess = {
    sequence: Sequence;
    accessed: number;
};

export type NodeIndexItem = {
    lat: number;
    lng: number;
    node: Image;
};

/**
 * @class Graph
 *
 * @classdesc Represents a graph of nodes with edges.
 */
export class Graph {
    private static _spatialIndex: new (...args: any[]) => any;

    private _api: APIWrapper;

    /**
     * Nodes that have initialized cache with a timestamp of last access.
     */
    private _cachedNodes: { [key: string]: NodeAccess; };

    /**
     * Nodes for which the required tiles are cached.
     */
    private _cachedNodeTiles: { [key: string]: boolean; };

    /**
     * Sequences for which the nodes are cached.
     */
    private _cachedSequenceNodes: { [sequenceKey: string]: boolean; };

    /**
     * Nodes for which the spatial edges are cached.
     */
    private _cachedSpatialEdges: { [key: string]: Image; };

    /**
     * Cached tiles with a timestamp of last access.
     */
    private _cachedTiles: { [h: string]: TileAccess; };

    /**
     * Nodes for which fill properties are being retreived.
     */
    private _cachingFill$: { [key: string]: Observable<Graph>; };

    /**
     * Nodes for which full properties are being retrieved.
     */
    private _cachingFull$: { [key: string]: Observable<Graph>; };

    /**
     * Sequences for which the nodes are being retrieved.
     */
    private _cachingSequenceNodes$: { [sequenceKey: string]: Observable<Graph>; };

    /**
     * Sequences that are being retrieved.
     */
    private _cachingSequences$: { [sequenceKey: string]: Observable<Graph>; };

    /**
     * Nodes for which the spatial area fill properties are being retrieved.
     */
    private _cachingSpatialArea$: { [key: string]: Observable<Graph>[]; };

    /**
     * Tiles that are being retrieved.
     */
    private _cachingTiles$: { [h: string]: Observable<Graph>; };

    private _changed$: Subject<Graph>;

    private _defaultAlt: number;
    private _edgeCalculator: EdgeCalculator;
    private _graphCalculator: GraphCalculator;
    private _configuration: GraphConfiguration;

    private _filter: FilterFunction;
    private _filterCreator: FilterCreator;
    private _filterSubject$: Subject<FilterFunction>;
    private _filter$: Observable<FilterFunction>;
    private _filterSubscription: Subscription;

    /**
     * All nodes in the graph.
     */
    private _nodes: { [key: string]: Image; };

    /**
     * Contains all nodes in the graph. Used for fast spatial lookups.
     */
    private _nodeIndex: any;

    /**
     * All node index items sorted in tiles for easy uncache.
     */
    private _nodeIndexTiles: { [h: string]: NodeIndexItem[]; };

    /**
     * Node to tile dictionary for easy tile access updates.
     */
    private _nodeToTile: { [key: string]: string; };

    /**
     * Nodes retrieved before tiles, stored on tile level.
     */
    private _preStored: { [h: string]: { [key: string]: Image; }; };

    /**
     * Tiles required for a node to retrive spatial area.
     */
    private _requiredNodeTiles: { [key: string]: NodeTiles; };

    /**
     * Other nodes required for node to calculate spatial edges.
     */
    private _requiredSpatialArea: { [key: string]: SpatialArea; };

    /**
     * All sequences in graph with a timestamp of last access.
     */
    private _sequences: { [skey: string]: SequenceAccess; };

    private _tileThreshold: number;

    /**
     * Create a new graph instance.
     *
     * @param {APIWrapper} [api] - API instance for retrieving data.
     * @param {rbush.RBush<NodeIndexItem>} [nodeIndex] - Node index for fast spatial retreival.
     * @param {GraphCalculator} [graphCalculator] - Instance for graph calculations.
     * @param {EdgeCalculator} [edgeCalculator] - Instance for edge calculations.
     * @param {FilterCreator} [filterCreator] - Instance for  filter creation.
     * @param {GraphConfiguration} [configuration] - Configuration struct.
     */
    constructor(
        api: APIWrapper,
        nodeIndex?: any,
        graphCalculator?: GraphCalculator,
        edgeCalculator?: EdgeCalculator,
        filterCreator?: FilterCreator,
        configuration?: GraphConfiguration) {

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

        this._filterCreator = filterCreator ?? new FilterCreator();
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
        this._edgeCalculator = edgeCalculator ?? new EdgeCalculator();
        this._graphCalculator = graphCalculator ?? new GraphCalculator();
        this._configuration = configuration ?? {
            maxSequences: 50,
            maxUnusedImages: 100,
            maxUnusedPreStoredImages: 30,
            maxUnusedTiles: 20,
        };

        this._nodes = {};
        this._nodeIndex = nodeIndex ?? new Graph._spatialIndex(16);
        this._nodeIndexTiles = {};
        this._nodeToTile = {};

        this._preStored = {};

        this._requiredNodeTiles = {};
        this._requiredSpatialArea = {};

        this._sequences = {};
        this._tileThreshold = 20;
    }

    public static register(spatialIndex: new (...args: any[]) => any): void {
        Graph._spatialIndex = spatialIndex;
    }

    /**
     * Get api.
     *
     * @returns {APIWrapper} The API instance used by
     * the graph.
     */
    public get api(): APIWrapper {
        return this._api;
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
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     * @returns {Observable<Array<Image>>} Observable emitting
     * the full nodes in the bounding box.
     */
    public cacheBoundingBox$(sw: LngLat, ne: LngLat): Observable<Image[]> {
        const cacheTiles$ = this._api.data.geometry.bboxToCellIds(sw, ne)
            .filter(
                (h: string): boolean => {
                    return !(h in this._cachedTiles);
                })
            .map(
                (h: string): Observable<Graph> => {
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
                (): Observable<Image[]> => {
                    const nodes = <Image[]>this._nodeIndex
                        .search({
                            maxX: ne.lng,
                            maxY: ne.lat,
                            minX: sw.lng,
                            minY: sw.lat,
                        })
                        .map(
                            (item: NodeIndexItem): Image => {
                                return item.node;
                            });

                    const fullNodes: Image[] = [];
                    const coreNodes: string[] = [];

                    for (const node of nodes) {
                        if (node.complete) {
                            fullNodes.push(node);
                        } else {
                            coreNodes.push(node.id);
                        }
                    }

                    const coreNodeBatches: string[][] = [];
                    const batchSize = 200;
                    while (coreNodes.length > 0) {
                        coreNodeBatches.push(coreNodes.splice(0, batchSize));
                    }

                    const fullNodes$ = observableOf(fullNodes);
                    const fillNodes$ = coreNodeBatches
                        .map((batch: string[]): Observable<Image[]> => {
                            return this._api
                                .getSpatialImages$(batch)
                                .pipe(
                                    map((items: SpatialImagesContract)
                                        : Image[] => {
                                        const result: Image[] = [];
                                        for (const item of items) {
                                            const exists = this
                                                .hasNode(item.node_id);
                                            if (!exists) { continue; }

                                            const node = this
                                                .getNode(item.node_id);
                                            if (!node.complete) {
                                                this._makeFull(node, item.node);
                                            }
                                            result.push(node);
                                        }
                                        return result;
                                    }));
                        });

                    return observableMerge(
                        fullNodes$,
                        observableFrom(fillNodes$).pipe(
                            mergeAll()));
                }),
            reduce(
                (acc: Image[], value: Image[]): Image[] => {
                    return acc.concat(value);
                }));
    }

    /**
     * Caches the full node data for all images of a cell.
     *
     * @description The node assets are not cached.
     *
     * @param {string} cellId - Cell id.
     * @returns {Observable<Array<Image>>} Observable
     * emitting the full nodes of the cell.
     */
    public cacheCell$(cellId: string): Observable<Image[]> {
        const cacheCell$ = cellId in this._cachedTiles ?
            observableOf(this) :
            cellId in this._cachingTiles$ ?
                this._cachingTiles$[cellId] :
                this._cacheTile$(cellId);

        return cacheCell$.pipe(
            mergeMap((): Observable<Image[]> => {
                const cachedCell = this._cachedTiles[cellId];
                cachedCell.accessed = new Date().getTime();
                const cellNodes = cachedCell.nodes;

                const fullNodes: Image[] = [];
                const coreNodes: string[] = [];
                for (const node of cellNodes) {
                    if (node.complete) {
                        fullNodes.push(node);
                    } else {
                        coreNodes.push(node.id);
                    }
                }

                const coreNodeBatches: string[][] = [];
                const batchSize: number = 200;
                while (coreNodes.length > 0) {
                    coreNodeBatches.push(coreNodes.splice(0, batchSize));
                }

                const fullNodes$ = observableOf(fullNodes);
                const fillNodes$ = coreNodeBatches
                    .map((batch: string[]): Observable<Image[]> => {
                        return this._api.getSpatialImages$(batch).pipe(
                            map((items: SpatialImagesContract):
                                Image[] => {
                                const filled: Image[] = [];
                                for (const item of items) {
                                    if (!item.node) {
                                        console.warn(
                                            `Image is empty (${item.node})`);
                                        continue;
                                    }

                                    const id = item.node_id;
                                    if (!this.hasNode(id)) { continue; }
                                    const node = this.getNode(id);
                                    if (!node.complete) {
                                        this._makeFull(node, item.node);
                                    }
                                    filled.push(node);
                                }
                                return filled;
                            }));
                    });

                return observableMerge(
                    fullNodes$,
                    observableFrom(fillNodes$).pipe(
                        mergeAll()));
            }),
            reduce(
                (acc: Image[], value: Image[]): Image[] => {
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

        const node = this.getNode(key);
        if (node.complete) {
            throw new GraphMapillaryError(`Cannot fill node that is already full (${key}).`);
        }

        this._cachingFill$[key] = this._api.getSpatialImages$([key]).pipe(
            tap(
                (items: SpatialImagesContract): void => {
                    for (const item of items) {
                        if (!item.node) {
                            console.warn(`Image is empty ${item.node_id}`);
                        }
                        if (!node.complete) {
                            this._makeFull(node, item.node);
                        }
                        delete this._cachingFill$[item.node_id];
                    }
                }),
            map((): Graph => { return this; }),
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

        this._cachingFull$[key] = this._api.getImages$([key]).pipe(
            tap(
                (items: ImagesContract): void => {
                    for (const item of items) {
                        if (!item.node) {
                            throw new GraphMapillaryError(
                                `Image does not exist (${key}, ${item.node}).`);
                        }

                        const id = item.node_id;
                        if (this.hasNode(id)) {
                            const node = this.getNode(key);
                            if (!node.complete) {
                                this._makeFull(node, item.node);
                            }
                        } else {
                            if (item.node.sequence.id == null) {
                                throw new GraphMapillaryError(
                                    `Image has no sequence key (${key}).`);
                            }

                            const node = new Image(item.node);
                            this._makeFull(node, item.node);

                            const cellId = this._api.data.geometry
                                .lngLatToCellId(node.originalLngLat);
                            this._preStore(cellId, node);
                            this._setNode(node);

                            delete this._cachingFull$[id];
                        }
                    }
                }),
            map((): Graph => this),
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

        let node: Image = this.getNode(key);
        if (node.sequenceId in this._sequences) {
            throw new GraphMapillaryError(`Sequence already cached (${key}), (${node.sequenceId}).`);
        }

        return this._cacheSequence$(node.sequenceId);
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
        let node: Image = this.getNode(key);

        if (!(node.sequenceId in this._sequences)) {
            throw new GraphMapillaryError(`Sequence is not cached (${key}), (${node.sequenceId})`);
        }

        let sequence: Sequence = this._sequences[node.sequenceId].sequence;
        let edges: NavigationEdge[] = this._edgeCalculator.computeSequenceEdges(node, sequence);

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
        if (sequence.id in this._cachingSequenceNodes$) {
            return this._cachingSequenceNodes$[sequence.id];
        }

        const batches: string[][] = [];
        const keys: string[] = sequence.imageIds.slice();

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
                    return this._api.getImages$(batch).pipe(
                        tap(
                            (items: ImagesContract): void => {
                                for (const item of items) {
                                    if (!item.node) {
                                        console.warn(
                                            `Image empty (${item.node_id})`);
                                        continue;
                                    }
                                    const id = item.node_id;
                                    if (this.hasNode(id)) {
                                        const node = this.getNode(id);
                                        if (!node.complete) {
                                            this._makeFull(node, item.node);
                                        }
                                    } else {
                                        if (item.node.sequence.id == null) {
                                            console.warn(`Sequence missing, discarding node (${item.node_id})`);
                                        }

                                        const node = new Image(item.node);
                                        this._makeFull(node, item.node);

                                        const cellId = this._api.data.geometry
                                            .lngLatToCellId(node.originalLngLat);
                                        this._preStore(cellId, node);
                                        this._setNode(node);
                                    }
                                }

                                batchesToCache--;
                            }),
                        map((): Graph => this));
                },
                6),
            last(),
            finalize(
                (): void => {
                    delete this._cachingSequenceNodes$[sequence.id];

                    if (batchesToCache === 0) {
                        this._cachedSequenceNodes[sequence.id] = true;
                    }
                }),
            publish(),
            refCount());

        this._cachingSequenceNodes$[sequence.id] = sequenceNodes$;

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
            throw new GraphMapillaryError(`Image already spatially cached (${key}).`);
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
            let spatialNodeBatch$: Observable<Graph> = this._api.getSpatialImages$(batch).pipe(
                tap(
                    (items: SpatialImagesContract): void => {
                        for (const item of items) {
                            if (!item.node) {
                                console.warn(`Image is empty (${item.node_id})`);
                                continue;
                            }

                            const id = item.node_id;
                            const spatialNode = spatialArea.cacheNodes[id];
                            if (spatialNode.complete) {
                                delete spatialArea.cacheNodes[id];
                                continue;
                            }

                            this._makeFull(spatialNode, item.node);
                            delete spatialArea.cacheNodes[id];
                        }

                        if (--batchesToCache === 0) {
                            delete this._cachingSpatialArea$[key];
                        }
                    }),
                map((): Graph => { return this; }),
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

        let node: Image = this.getNode(key);
        let sequence: Sequence = this._sequences[node.sequenceId].sequence;

        let fallbackKeys: string[] = [];
        let prevKey: string = sequence.findPrev(node.id);
        if (prevKey != null) {
            fallbackKeys.push(prevKey);
        }

        let nextKey: string = sequence.findNext(node.id);
        if (nextKey != null) {
            fallbackKeys.push(nextKey);
        }

        let allSpatialNodes: { [key: string]: Image; } = this._requiredSpatialArea[key].all;
        let potentialNodes: Image[] = [];
        let filter: FilterFunction = this._filter;
        for (let spatialNodeKey in allSpatialNodes) {
            if (!allSpatialNodes.hasOwnProperty(spatialNodeKey)) {
                continue;
            }

            let spatialNode: Image = allSpatialNodes[spatialNodeKey];

            if (filter(spatialNode)) {
                potentialNodes.push(spatialNode);
            }
        }

        let potentialEdges: PotentialEdge[] =
            this._edgeCalculator.getPotentialEdges(node, potentialNodes, fallbackKeys);

        let edges: NavigationEdge[] =
            this._edgeCalculator.computeStepEdges(
                node,
                potentialEdges,
                prevKey,
                nextKey);

        edges = edges.concat(this._edgeCalculator.computeTurnEdges(node, potentialEdges));
        edges = edges.concat(this._edgeCalculator.computeSphericalEdges(node, potentialEdges));
        edges = edges.concat(this._edgeCalculator.computePerspectiveToSphericalEdges(node, potentialEdges));
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
            throw new GraphMapillaryError(`Image already in cache (${key}).`);
        }

        const node: Image = this.getNode(key);
        const provider = this._api.data;
        node.initializeCache(new ImageCache(provider));

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
        let node: Image = this.getNode(key);

        return node.sequenceId in this._cachingSequences$;
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
        let node: Image = this.getNode(key);
        let sequenceKey: string = node.sequenceId;

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
            return Object
                .keys(this._requiredSpatialArea[key].cacheNodes)
                .length === 0;
        }

        let node = this.getNode(key);
        let bbox = this._graphCalculator
            .boundingBoxCorners(
                node.lngLat,
                this._tileThreshold);

        let spatialItems = <NodeIndexItem[]>this._nodeIndex
            .search({
                maxX: bbox[1].lng,
                maxY: bbox[1].lat,
                minX: bbox[0].lng,
                minY: bbox[0].lat,
            });

        let spatialNodes: SpatialArea = {
            all: {},
            cacheKeys: [],
            cacheNodes: {},
        };

        for (let spatialItem of spatialItems) {
            spatialNodes.all[spatialItem.node.id] = spatialItem.node;

            if (!spatialItem.node.complete) {
                spatialNodes.cacheKeys.push(spatialItem.node.id);
                spatialNodes.cacheNodes[spatialItem.node.id] = spatialItem.node;
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
            throw new GraphMapillaryError(`Image does not exist in graph (${key}).`);
        }

        let nodeTiles: NodeTiles = { cache: [], caching: [] };

        if (!(key in this._requiredNodeTiles)) {
            const node = this.getNode(key);
            const [sw, ne] = this._graphCalculator
                .boundingBoxCorners(
                    node.lngLat,
                    this._tileThreshold);

            nodeTiles.cache = this._api.data.geometry
                .bboxToCellIds(sw, ne)
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
     * @returns {Image} Retrieved node.
     */
    public getNode(key: string): Image {
        let accessed: number = new Date().getTime();

        this._updateCachedNodeAccess(key, accessed);
        this._updateCachedTileAccess(key, accessed);

        return this._nodes[key];
    }

    /**
     * Get a sequence.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {Image} Retrieved sequence.
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
            let node: Image = this._cachedSpatialEdges[cachedKey];
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
        const nodes: Image[] = [];
        for (const key of keepKeys) {
            if (!this.hasNode(key)) {
                throw new Error(`Image does not exist ${key}`);
            }

            const node: Image = this.getNode(key);
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
            this._nodes[node.id] = node;

            const h: string = this._api.data.geometry.lngLatToCellId(node.originalLngLat);
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
     * @emits FilterFunction The filter function to the {@link Graph.filter$}
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
     * @param {Array<string>} keepIds - Ids of nodes to keep in
     * graph unrelated to last access. Tiles related to those keys
     * will also be kept in graph.
     * @param {Array<string>} keepCellIds - Ids of cells to keep in
     * graph unrelated to last access. The nodes of the cells may
     * still be uncached if not specified in the keep ids param
     * but are guaranteed to not be disposed.
     * @param {string} keepSequenceId - Optional id of sequence
     * for which the belonging nodes should not be disposed or
     * removed from the graph. These nodes may still be uncached if
     * not specified in keep ids param but are guaranteed to not
     * be disposed.
     */
    public uncache(
        keepIds: string[],
        keepCellIds: string[],
        keepSequenceId?: string)
        : void {

        const idsInUse: { [id: string]: boolean; } = {};

        this._addNewKeys(idsInUse, this._cachingFull$);
        this._addNewKeys(idsInUse, this._cachingFill$);
        this._addNewKeys(idsInUse, this._cachingSpatialArea$);
        this._addNewKeys(idsInUse, this._requiredNodeTiles);
        this._addNewKeys(idsInUse, this._requiredSpatialArea);

        for (const key of keepIds) {
            if (key in idsInUse) { continue; }
            idsInUse[key] = true;
        }

        const tileThreshold = this._tileThreshold;
        const calculator = this._graphCalculator;
        const geometry = this._api.data.geometry;
        const keepCells = new Set<string>(keepCellIds);
        for (let id in idsInUse) {
            if (!idsInUse.hasOwnProperty(id)) { continue; }

            const node = this._nodes[id];
            const [sw, ne] = calculator
                .boundingBoxCorners(
                    node.lngLat,
                    tileThreshold,
                );
            const nodeCellIds = geometry.bboxToCellIds(sw, ne);

            for (const nodeCellId of nodeCellIds) {
                if (!keepCells.has(nodeCellId)) {
                    keepCells.add(nodeCellId);
                }
            }
        }

        const potentialCells: [string, TileAccess][] = [];
        for (let cellId in this._cachedTiles) {
            if (!this._cachedTiles.hasOwnProperty(cellId) ||
                keepCells.has(cellId)) {
                continue;
            }
            potentialCells.push([cellId, this._cachedTiles[cellId]]);
        }

        const uncacheCells = potentialCells
            .sort(
                (h1: [string, TileAccess], h2: [string, TileAccess]): number => {
                    return h2[1].accessed - h1[1].accessed;
                })
            .slice(this._configuration.maxUnusedTiles)
            .map(
                (h: [string, TileAccess]): string => {
                    return h[0];
                });

        for (let uncacheCell of uncacheCells) {
            this._uncacheTile(uncacheCell, keepSequenceId);
        }

        const potentialPreStored: [NodeAccess, string][] = [];
        const nonCachedPreStored: [string, string][] = [];
        for (let cellId in this._preStored) {
            if (!this._preStored.hasOwnProperty(cellId) ||
                cellId in this._cachingTiles$) {
                continue;
            }

            const prestoredNodes = this._preStored[cellId];
            for (let id in prestoredNodes) {
                if (!prestoredNodes.hasOwnProperty(id) || id in idsInUse) {
                    continue;
                }

                if (prestoredNodes[id].sequenceId === keepSequenceId) {
                    continue;
                }

                if (id in this._cachedNodes) {
                    potentialPreStored.push([this._cachedNodes[id], cellId]);
                } else {
                    nonCachedPreStored.push([id, cellId]);
                }
            }
        }

        const uncachePreStored = potentialPreStored
            .sort(
                ([na1]: [NodeAccess, string], [na2]: [NodeAccess, string]): number => {
                    return na2.accessed - na1.accessed;
                })
            .slice(this._configuration.maxUnusedPreStoredImages)
            .map(
                ([na, h]: [NodeAccess, string]): [string, string] => {
                    return [na.node.id, h];
                });

        this._uncachePreStored(nonCachedPreStored);
        this._uncachePreStored(uncachePreStored);

        const potentialNodes: NodeAccess[] = [];
        for (let id in this._cachedNodes) {
            if (!this._cachedNodes.hasOwnProperty(id) || id in idsInUse) {
                continue;
            }

            potentialNodes.push(this._cachedNodes[id]);
        }

        const uncacheNodes = potentialNodes
            .sort(
                (n1: NodeAccess, n2: NodeAccess): number => {
                    return n2.accessed - n1.accessed;
                })
            .slice(this._configuration.maxUnusedImages);

        for (const nodeAccess of uncacheNodes) {
            nodeAccess.node.uncache();
            const id = nodeAccess.node.id;
            delete this._cachedNodes[id];

            if (id in this._cachedNodeTiles) {
                delete this._cachedNodeTiles[id];
            }

            if (id in this._cachedSpatialEdges) {
                delete this._cachedSpatialEdges[id];
            }
        }

        const potentialSequences: SequenceAccess[] = [];
        for (let sequenceId in this._sequences) {
            if (!this._sequences.hasOwnProperty(sequenceId) ||
                sequenceId in this._cachingSequences$ ||
                sequenceId === keepSequenceId) {
                continue;
            }

            potentialSequences.push(this._sequences[sequenceId]);
        }

        const uncacheSequences = potentialSequences
            .sort(
                (s1: SequenceAccess, s2: SequenceAccess): number => {
                    return s2.accessed - s1.accessed;
                })
            .slice(this._configuration.maxSequences);

        for (const sequenceAccess of uncacheSequences) {
            const sequenceId = sequenceAccess.sequence.id;

            delete this._sequences[sequenceId];

            if (sequenceId in this._cachedSequenceNodes) {
                delete this._cachedSequenceNodes[sequenceId];
            }

            sequenceAccess.sequence.dispose();
        }
    }

    /**
     * Updates existing cells with new core nodes.
     *
     * @description Non-existing cells are discarded
     * and not requested at all.
     *
     * Existing nodes are not changed.
     *
     * New nodes are not made full or getting assets
     * cached.
     *
     * @param {Array<string>} cellIds - Cell ids.
     * @returns {Observable<Array<Image>>} Observable
     * emitting the updated cells.
     */
    public updateCells$(cellIds: string[]): Observable<string> {
        const cachedCells = this._cachedTiles;
        const cachingCells = this._cachingTiles$;
        return observableFrom(cellIds)
            .pipe(
                mergeMap(
                    (cellId: string): Observable<string> => {
                        if (cellId in cachedCells) {
                            return this._updateCell$(cellId);
                        }
                        if (cellId in cachingCells) {
                            return cachingCells[cellId]
                                .pipe(
                                    catchError((): Observable<Graph> => {
                                        return observableOf(this);
                                    }),
                                    mergeMap(() => this._updateCell$(cellId)));
                        }
                        return observableEmpty();
                    }
                ));
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

    private _addNewKeys<T>(keys: { [key: string]: boolean; }, dict: { [key: string]: T; }): void {
        for (let key in dict) {
            if (!dict.hasOwnProperty(key) || !this.hasNode(key)) {
                continue;
            }

            if (!(key in keys)) {
                keys[key] = true;
            }
        }
    }

    private _cacheSequence$(sequenceId: string): Observable<Graph> {
        if (sequenceId in this._cachingSequences$) {
            return this._cachingSequences$[sequenceId];
        }

        this._cachingSequences$[sequenceId] = this._api
            .getSequence$(sequenceId)
            .pipe(
                tap(
                    (sequence: SequenceContract): void => {
                        if (!sequence) {
                            console.warn(
                                `Sequence does not exist ` +
                                `(${sequenceId})`);
                        } else {
                            if (!(sequence.id in this._sequences)) {
                                this._sequences[sequence.id] = {
                                    accessed: new Date().getTime(),
                                    sequence: new Sequence(sequence),
                                };
                            }

                            delete this._cachingSequences$[sequenceId];
                        }


                    }),
                map((): Graph => { return this; }),
                finalize(
                    (): void => {
                        if (sequenceId in this._cachingSequences$) {
                            delete this._cachingSequences$[sequenceId];
                        }

                        this._changed$.next(this);
                    }),
                publish(),
                refCount());

        return this._cachingSequences$[sequenceId];
    }

    private _cacheTile$(cellId: string): Observable<Graph> {
        this._cachingTiles$[cellId] = this._api
            .getCoreImages$(cellId)
            .pipe(
                tap((contract: CoreImagesContract): void => {
                    if (cellId in this._cachedTiles) {
                        return;
                    }
                    const cores = contract.images;
                    this._nodeIndexTiles[cellId] = [];
                    this._cachedTiles[cellId] = {
                        accessed: new Date().getTime(),
                        nodes: [],
                    };
                    const hCache = this._cachedTiles[cellId].nodes;
                    const preStored = this._removeFromPreStore(cellId);

                    for (const core of cores) {
                        if (!core) { break; }

                        if (core.sequence.id == null) {
                            console.warn(`Sequence missing, discarding ` +
                                `node (${core.id})`);
                            continue;
                        }

                        if (preStored != null && core.id in preStored) {
                            const preStoredNode = preStored[core.id];
                            delete preStored[core.id];
                            hCache.push(preStoredNode);
                            const preStoredNodeIndexItem: NodeIndexItem = {
                                lat: preStoredNode.lngLat.lat,
                                lng: preStoredNode.lngLat.lng,
                                node: preStoredNode,
                            };
                            this._nodeIndex.insert(preStoredNodeIndexItem);
                            this._nodeIndexTiles[cellId]
                                .push(preStoredNodeIndexItem);
                            this._nodeToTile[preStoredNode.id] = cellId;
                            continue;
                        }

                        const node = new Image(core);
                        hCache.push(node);
                        const nodeIndexItem: NodeIndexItem = {
                            lat: node.lngLat.lat,
                            lng: node.lngLat.lng,
                            node: node,
                        };

                        this._nodeIndex.insert(nodeIndexItem);
                        this._nodeIndexTiles[cellId].push(nodeIndexItem);
                        this._nodeToTile[node.id] = cellId;

                        this._setNode(node);
                    }

                    delete this._cachingTiles$[cellId];
                }),
                map((): Graph => this),
                catchError(
                    (error: Error): Observable<Graph> => {
                        delete this._cachingTiles$[cellId];

                        throw error;
                    }),
                publish(),
                refCount());

        return this._cachingTiles$[cellId];
    }

    private _makeFull(node: Image, fillNode: SpatialImageEnt): void {
        if (fillNode.computed_altitude == null) {
            fillNode.computed_altitude = this._defaultAlt;
        }

        if (fillNode.computed_rotation == null) {
            fillNode.computed_rotation = this._graphCalculator.rotationFromCompass(fillNode.compass_angle, fillNode.exif_orientation);
        }

        node.makeComplete(fillNode);
    }

    private _preStore(h: string, node: Image): void {
        if (!(h in this._preStored)) {
            this._preStored[h] = {};
        }

        this._preStored[h][node.id] = node;
    }

    private _removeFromPreStore(h: string): { [key: string]: Image; } {
        let preStored: { [key: string]: Image; } = null;

        if (h in this._preStored) {
            preStored = this._preStored[h];
            delete this._preStored[h];
        }

        return preStored;
    }

    private _setNode(node: Image): void {
        let key: string = node.id;

        if (this.hasNode(key)) {
            throw new GraphMapillaryError(`Image already exist (${key}).`);
        }

        this._nodes[key] = node;
    }

    private _uncacheTile(h: string, keepSequenceKey: string): void {
        for (let node of this._cachedTiles[h].nodes) {
            let key: string = node.id;

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

            if (node.sequenceId === keepSequenceKey) {
                this._preStore(h, node);
                node.uncache();
            } else {
                delete this._nodes[key];

                if (node.sequenceId in this._cachedSequenceNodes) {
                    delete this._cachedSequenceNodes[node.sequenceId];
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
        let hs: { [h: string]: boolean; } = {};
        for (let [key, h] of preStored) {
            if (key in this._nodes) {
                delete this._nodes[key];
            }

            if (key in this._cachedNodes) {
                delete this._cachedNodes[key];
            }

            let node: Image = this._preStored[h][key];

            if (node.sequenceId in this._cachedSequenceNodes) {
                delete this._cachedSequenceNodes[node.sequenceId];
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

    private _updateCell$(cellId: string): Observable<string> {
        return this._api.getCoreImages$(cellId).pipe(
            mergeMap(
                (contract: CoreImagesContract): Observable<string> => {
                    if (!(cellId in this._cachedTiles)) {
                        return observableEmpty();
                    }

                    const nodeIndex = this._nodeIndex;
                    const nodeIndexCell = this._nodeIndexTiles[cellId];
                    const nodeToCell = this._nodeToTile;
                    const cell = this._cachedTiles[cellId];
                    cell.accessed = new Date().getTime();
                    const cellNodes = cell.nodes;

                    const cores = contract.images;
                    for (const core of cores) {
                        if (core == null) { break; }
                        if (this.hasNode(core.id)) { continue; }

                        if (core.sequence.id == null) {
                            console.warn(`Sequence missing, discarding ` +
                                `node (${core.id})`);
                            continue;
                        }

                        const node = new Image(core);
                        cellNodes.push(node);
                        const nodeIndexItem: NodeIndexItem = {
                            lat: node.lngLat.lat,
                            lng: node.lngLat.lng,
                            node: node,
                        };
                        nodeIndex.insert(nodeIndexItem);
                        nodeIndexCell.push(nodeIndexItem);
                        nodeToCell[node.id] = cellId;
                        this._setNode(node);
                    }
                    return observableOf(cellId);
                }),
            catchError(
                (error: Error): Observable<string> => {
                    console.error(error);
                    return observableEmpty();
                }));
    }
}
