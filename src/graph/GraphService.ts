import {
    concat as observableConcat,
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    catchError,
    expand,
    finalize,
    first,
    map,
    mergeMap,
    publishReplay,
    refCount,
    startWith,
    tap,
    takeLast,
} from "rxjs/operators";

import { FilterFunction } from "./FilterCreator";
import { FilterExpression } from "./FilterExpression";
import { Graph } from "./Graph";
import { GraphMode } from "./GraphMode";
import { Image } from "./Image";
import { Sequence } from "./Sequence";

import { LngLat } from "../api/interfaces/LngLat";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { ProviderCellEvent } from "../api/events/ProviderCellEvent";
import { GraphMapillaryError } from "../error/GraphMapillaryError";

/**
 * @class GraphService
 *
 * @classdesc Represents a service for graph operations.
 */
export class GraphService {
    private _graph$: Observable<Graph>;
    private _graphMode: GraphMode;
    private _graphMode$: Observable<GraphMode>;
    private _graphModeSubject$: Subject<GraphMode>;

    private _firstGraphSubjects$: Subject<Graph>[];

    private _dataAdded$: Subject<string> = new Subject<string>();

    private _initializeCacheSubscriptions: Subscription[];
    private _sequenceSubscriptions: Subscription[];
    private _spatialSubscriptions: Subscription[];
    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    /**
     * Create a new graph service instance.
     *
     * @param {Graph} graph - Graph instance to be operated on.
     */
    constructor(graph: Graph) {
        const subs = this._subscriptions;

        this._graph$ = observableConcat(
            observableOf(graph),
            graph.changed$).pipe(
                publishReplay(1),
                refCount());

        subs.push(this._graph$.subscribe(() => { /*noop*/ }));

        this._graphMode = GraphMode.Spatial;
        this._graphModeSubject$ = new Subject<GraphMode>();
        this._graphMode$ = this._graphModeSubject$.pipe(
            startWith(this._graphMode),
            publishReplay(1),
            refCount());

        subs.push(this._graphMode$.subscribe(() => { /*noop*/ }));

        this._firstGraphSubjects$ = [];

        this._initializeCacheSubscriptions = [];
        this._sequenceSubscriptions = [];
        this._spatialSubscriptions = [];

        graph.api.data.on("datacreate", this._onDataAdded);
    }

    /**
     * Get dataAdded$.
     *
     * @returns {Observable<string>} Observable emitting
     * a cell id every time data has been added to a cell.
     */
    public get dataAdded$(): Observable<string> {
        return this._dataAdded$;
    }

    /**
     * Get filter observable.
     *
     * @desciption Emits the filter every time it has changed.
     *
     * @returns {Observable<FilterFunction>} Observable
     * emitting the filter function every time it is set.
     */
    public get filter$(): Observable<FilterFunction> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<FilterFunction> => {
                    return graph.filter$;
                }));
    }

    /**
     * Get graph mode observable.
     *
     * @description Emits the current graph mode.
     *
     * @returns {Observable<GraphMode>} Observable
     * emitting the current graph mode when it changes.
     */
    public get graphMode$(): Observable<GraphMode> {
        return this._graphMode$;
    }

    /**
     * Cache full images in a bounding box.
     *
     * @description When called, the full properties of
     * the image are retrieved. The image cache is not initialized
     * for any new images retrieved and the image assets are not
     * retrieved, {@link cacheImage$} needs to be called for caching
     * assets.
     *
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     * @return {Observable<Array<Image>>} Observable emitting a single item,
     * the images of the bounding box, when they have all been retrieved.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    public cacheBoundingBox$(sw: LngLat, ne: LngLat): Observable<Image[]> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Image[]> => {
                    return graph.cacheBoundingBox$(sw, ne);
                }));
    }

    /**
     * Cache full images in a cell.
     *
     * @description When called, the full properties of
     * the image are retrieved. The image cache is not initialized
     * for any new images retrieved and the image assets are not
     * retrieved, {@link cacheImage$} needs to be called for caching
     * assets.
     *
     * @param {string} cellId - Id of the cell.
     * @return {Observable<Array<Image>>} Observable emitting a single item,
     * the images of the cell, when they have all been retrieved.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    public cacheCell$(cellId: string): Observable<Image[]> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Image[]> => {
                    return graph.cacheCell$(cellId);
                }));
    }

    /**
     * Cache a image in the graph and retrieve it.
     *
     * @description When called, the full properties of
     * the image are retrieved and the image cache is initialized.
     * After that the image assets are cached and the image
     * is emitted to the observable when.
     * In parallel to caching the image assets, the sequence and
     * spatial edges of the image are cached. For this, the sequence
     * of the image and the required tiles and spatial images are
     * retrieved. The sequence and spatial edges may be set before
     * or after the image is returned.
     *
     * @param {string} id - Id of the image to cache.
     * @return {Observable<Image>} Observable emitting a single item,
     * the image, when it has been retrieved and its assets are cached.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    public cacheImage$(id: string): Observable<Image> {
        const firstGraphSubject$: Subject<Graph> = new Subject<Graph>();

        this._firstGraphSubjects$.push(firstGraphSubject$);

        const firstGraph$: Observable<Graph> = firstGraphSubject$.pipe(
            publishReplay(1),
            refCount());

        const image$: Observable<Image> = firstGraph$.pipe(
            map(
                (graph: Graph): Image => {
                    return graph.getNode(id);
                }),
            mergeMap(
                (image: Image): Observable<Image> => {
                    return image.assetsCached ?
                        observableOf(image) :
                        image.cacheAssets$();
                }),
            publishReplay(1),
            refCount());

        image$.subscribe(
            undefined,
            (error: Error): void => {
                console.error(`Failed to cache image (${id}).`, error);
            });

        let initializeCacheSubscription: Subscription;
        initializeCacheSubscription = this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingFull(id) || !graph.hasNode(id)) {
                        return graph.cacheFull$(id);
                    }

                    if (graph.isCachingFill(id) || !graph.getNode(id).complete) {
                        return graph.cacheFill$(id);
                    }

                    return observableOf<Graph>(graph);
                }),
            tap(
                (graph: Graph): void => {
                    if (!graph.hasNode(id)) {
                        throw new GraphMapillaryError(`Failed to cache image (${id})`);
                    }

                    if (!graph.hasInitializedCache(id)) {
                        graph.initializeCache(id);
                    }
                }),
            finalize(
                (): void => {
                    if (initializeCacheSubscription == null) {
                        return;
                    }

                    this._removeFromArray(initializeCacheSubscription, this._initializeCacheSubscriptions);
                    this._removeFromArray(firstGraphSubject$, this._firstGraphSubjects$);
                }))
            .subscribe(
                (graph: Graph): void => {
                    firstGraphSubject$.next(graph);
                    firstGraphSubject$.complete();
                },
                (error: Error): void => {
                    firstGraphSubject$.error(error);
                });

        if (!initializeCacheSubscription.closed) {
            this._initializeCacheSubscriptions.push(initializeCacheSubscription);
        }

        const graphSequence$: Observable<Graph> = firstGraph$.pipe(
            catchError(
                (): Observable<Graph> => {
                    return observableEmpty();
                }),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingNodeSequence(id) || !graph.hasNodeSequence(id)) {
                        return graph.cacheNodeSequence$(id);
                    }

                    return observableOf<Graph>(graph);
                }),
            publishReplay(1),
            refCount());

        let sequenceSubscription: Subscription;
        sequenceSubscription = graphSequence$.pipe(
            tap(
                (graph: Graph): void => {
                    if (!graph.getNode(id).sequenceEdges.cached) {
                        graph.cacheSequenceEdges(id);
                    }
                }),
            finalize(
                (): void => {
                    if (sequenceSubscription == null) {
                        return;
                    }

                    this._removeFromArray(sequenceSubscription, this._sequenceSubscriptions);
                }))
            .subscribe(
                (): void => { return; },
                (error: Error): void => {
                    console.error(`Failed to cache sequence edges (${id}).`, error);
                });

        if (!sequenceSubscription.closed) {
            this._sequenceSubscriptions.push(sequenceSubscription);
        }

        if (this._graphMode === GraphMode.Spatial) {
            let spatialSubscription: Subscription;
            spatialSubscription = firstGraph$.pipe(
                catchError(
                    (): Observable<Graph> => {
                        return observableEmpty();
                    }),
                expand(
                    (graph: Graph): Observable<Graph> => {
                        if (graph.hasTiles(id)) {
                            return observableEmpty();
                        }

                        return observableFrom(graph.cacheTiles$(id)).pipe(
                            mergeMap(
                                (graph$: Observable<Graph>): Observable<Graph> => {
                                    return graph$.pipe(
                                        mergeMap(
                                            (g: Graph): Observable<Graph> => {
                                                if (g.isCachingTiles(id)) {
                                                    return observableEmpty();
                                                }

                                                return observableOf<Graph>(g);
                                            }),
                                        catchError(
                                            (error: Error): Observable<Graph> => {
                                                console.error(`Failed to cache tile data (${id}).`, error);

                                                return observableEmpty();
                                            }));
                                }));
                    }),
                takeLast(1),
                mergeMap(
                    (graph: Graph): Observable<Graph> => {
                        if (graph.hasSpatialArea(id)) {
                            return observableOf<Graph>(graph);
                        }

                        return observableFrom(graph.cacheSpatialArea$(id)).pipe(
                            mergeMap(
                                (graph$: Observable<Graph>): Observable<Graph> => {
                                    return graph$.pipe(
                                        catchError(
                                            (error: Error): Observable<Graph> => {
                                                console.error(`Failed to cache spatial images (${id}).`, error);

                                                return observableEmpty();
                                            }));
                                }));
                    }),
                takeLast(1),
                mergeMap(
                    (graph: Graph): Observable<Graph> => {
                        return graph.hasNodeSequence(id) ?
                            observableOf<Graph>(graph) :
                            graph.cacheNodeSequence$(id);
                    }),
                tap(
                    (graph: Graph): void => {
                        if (!graph.getNode(id).spatialEdges.cached) {
                            graph.cacheSpatialEdges(id);
                        }
                    }),
                finalize(
                    (): void => {
                        if (spatialSubscription == null) {
                            return;
                        }

                        this._removeFromArray(spatialSubscription, this._spatialSubscriptions);
                    }))
                .subscribe(
                    (): void => { return; },
                    (error: Error): void => {
                        const message =
                            `Failed to cache spatial edges (${id}).`;
                        console.error(message, error);
                    });

            if (!spatialSubscription.closed) {
                this._spatialSubscriptions.push(spatialSubscription);
            }
        }

        return image$.pipe(
            first(
                (image: Image): boolean => {
                    return image.assetsCached;
                }));
    }

    /**
     * Cache a sequence in the graph and retrieve it.
     *
     * @param {string} sequenceId - Sequence id.
     * @returns {Observable<Sequence>} Observable emitting a single item,
     * the sequence, when it has been retrieved and its assets are cached.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    public cacheSequence$(sequenceId: string): Observable<Sequence> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequence(sequenceId) || !graph.hasSequence(sequenceId)) {
                        return graph.cacheSequence$(sequenceId);
                    }

                    return observableOf<Graph>(graph);
                }),
            map(
                (graph: Graph): Sequence => {
                    return graph.getSequence(sequenceId);
                }));
    }

    /**
     * Cache a sequence and its images in the graph and retrieve the sequence.
     *
     * @description Caches a sequence and its assets are cached and
     * retrieves all images belonging to the sequence. The image assets
     * or edges will not be cached.
     *
     * @param {string} sequenceId - Sequence id.
     * @param {string} referenceImageId - Id of image to use as reference
     * for optimized caching.
     * @returns {Observable<Sequence>} Observable emitting a single item,
     * the sequence, when it has been retrieved, its assets are cached and
     * all images belonging to the sequence has been retrieved.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    public cacheSequenceImages$(sequenceId: string, referenceImageId?: string): Observable<Sequence> {
        return this._graph$.pipe(
            first(),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequence(sequenceId) || !graph.hasSequence(sequenceId)) {
                        return graph.cacheSequence$(sequenceId);
                    }

                    return observableOf<Graph>(graph);
                }),
            mergeMap(
                (graph: Graph): Observable<Graph> => {
                    if (graph.isCachingSequenceNodes(sequenceId) || !graph.hasSequenceNodes(sequenceId)) {
                        return graph.cacheSequenceNodes$(sequenceId, referenceImageId);
                    }

                    return observableOf<Graph>(graph);
                }),
            map(
                (graph: Graph): Sequence => {
                    return graph.getSequence(sequenceId);
                }));
    }

    /**
     * Dispose the graph service and its children.
     */
    public dispose(): void {
        this._graph$
            .pipe(first())
            .subscribe((graph: Graph) => { graph.unsubscribe(); });
        this._subscriptions.unsubscribe();
    }

    /**
     * Set a spatial edge filter on the graph.
     *
     * @description Resets the spatial edges of all cached images.
     *
     * @param {FilterExpression} filter - Filter expression to be applied.
     * @return {Observable<Graph>} Observable emitting a single item,
     * the graph, when the spatial edges have been reset.
     */
    public setFilter$(filter: FilterExpression): Observable<void> {
        this._resetSubscriptions(this._spatialSubscriptions);

        return this._graph$.pipe(
            first(),
            tap(
                (graph: Graph): void => {
                    graph.resetSpatialEdges();
                    graph.setFilter(filter);
                }),
            map(
                (): void => {
                    return undefined;
                }));
    }

    /**
     * Set the graph mode.
     *
     * @description If graph mode is set to spatial, caching
     * is performed with emphasis on spatial edges. If graph
     * mode is set to sequence no tile data is requested and
     * no spatial edges are computed.
     *
     * When setting graph mode to sequence all spatial
     * subscriptions are aborted.
     *
     * @param {GraphMode} mode - Graph mode to set.
     */
    public setGraphMode(mode: GraphMode): void {
        if (this._graphMode === mode) {
            return;
        }

        if (mode === GraphMode.Sequence) {
            this._resetSubscriptions(this._spatialSubscriptions);
        }

        this._graphMode = mode;
        this._graphModeSubject$.next(this._graphMode);
    }

    /**
     * Reset the graph.
     *
     * @description Resets the graph but keeps the images of the
     * supplied ids.
     *
     * @param {Array<string>} keepIds - Ids of images to keep in graph.
     * @return {Observable<Image>} Observable emitting a single item,
     * the graph, when it has been reset.
     */
    public reset$(keepIds: string[]): Observable<void> {
        this._abortSubjects(this._firstGraphSubjects$);
        this._resetSubscriptions(this._initializeCacheSubscriptions);
        this._resetSubscriptions(this._sequenceSubscriptions);
        this._resetSubscriptions(this._spatialSubscriptions);

        return this._graph$.pipe(
            first(),
            tap(
                (graph: Graph): void => {
                    graph.reset(keepIds);
                }),
            map(
                (): void => {
                    return undefined;
                }));
    }

    /**
     * Uncache the graph.
     *
     * @description Uncaches the graph by removing tiles, images and
     * sequences. Keeps the images of the supplied ids and the tiles
     * related to those images.
     *
     * @param {Array<string>} keepIds - Ids of images to keep in graph.
     * @param {Array<string>} keepCellIds - Ids of cells to keep in graph.
     * @param {string} keepSequenceId - Optional id of sequence
     * for which the belonging images should not be disposed or
     * removed from the graph. These images may still be uncached if
     * not specified in keep ids param.
     * @return {Observable<Graph>} Observable emitting a single item,
     * the graph, when the graph has been uncached.
     */
    public uncache$(
        keepIds: string[],
        keepCellIds: string[],
        keepSequenceId?: string)
        : Observable<void> {

        return this._graph$.pipe(
            first(),
            tap(
                (graph: Graph): void => {
                    graph.uncache(keepIds, keepCellIds, keepSequenceId);
                }),
            map(
                (): void => {
                    return undefined;
                }));
    }

    private _abortSubjects<T>(subjects: Subject<T>[]): void {
        for (const subject of subjects.slice()) {
            this._removeFromArray(subject, subjects);

            subject.error(new Error("Cache image request was aborted."));
        }
    }

    private _onDataAdded = (event: ProviderCellEvent): void => {
        this._graph$
            .pipe(
                first(),
                mergeMap(
                    graph => {
                        return graph.updateCells$(event.cellIds).pipe(
                            tap(() => { graph.resetSpatialEdges(); }));
                    }))
            .subscribe(cellId => { this._dataAdded$.next(cellId); });
    };

    private _removeFromArray<T>(object: T, objects: T[]): void {
        const index: number = objects.indexOf(object);
        if (index !== -1) {
            objects.splice(index, 1);
        }
    }

    private _resetSubscriptions(subscriptions: Subscription[]): void {
        for (const subscription of subscriptions.slice()) {
            this._removeFromArray(subscription, subscriptions);

            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        }
    }
}
