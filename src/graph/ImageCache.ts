import {
    combineLatest as observableCombineLatest,
    of as observableOf,
    Observable,
    Subject,
    Subscriber,
    Subscription,
} from "rxjs";

import {
    finalize,
    first,
    map,
    publishReplay,
    refCount,
    startWith,
    tap,
} from "rxjs/operators";

import { NavigationEdge } from "./edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus } from "./interfaces/NavigationEdgeStatus";

import { MeshContract } from "../api/contracts/MeshContract";
import { IDataProvider } from "../api/interfaces/IDataProvider";
import { SpatialImageEnt } from "../api/ents/SpatialImageEnt";

/**
 * @class ImageCache
 *
 * @classdesc Represents the cached properties of a image.
 */
export class ImageCache {
    private _disposed: boolean;

    private _provider: IDataProvider;

    private _image: HTMLImageElement;
    private _mesh: MeshContract;
    private _sequenceEdges: NavigationEdgeStatus;
    private _spatialEdges: NavigationEdgeStatus;

    private _imageAborter: Function;
    private _meshAborter: Function;

    private _imageChanged$: Subject<HTMLImageElement>;
    private _image$: Observable<HTMLImageElement>;
    private _sequenceEdgesChanged$: Subject<NavigationEdgeStatus>;
    private _sequenceEdges$: Observable<NavigationEdgeStatus>;
    private _spatialEdgesChanged$: Subject<NavigationEdgeStatus>;
    private _spatialEdges$: Observable<NavigationEdgeStatus>;

    private _cachingAssets$: Observable<ImageCache>;

    private _iamgeSubscription: Subscription;
    private _sequenceEdgesSubscription: Subscription;
    private _spatialEdgesSubscription: Subscription;

    /**
     * Create a new image cache instance.
     */
    constructor(provider: IDataProvider) {
        this._disposed = false;

        this._provider = provider;

        this._image = null;
        this._mesh = null;
        this._sequenceEdges = { cached: false, edges: [] };
        this._spatialEdges = { cached: false, edges: [] };

        this._imageChanged$ = new Subject<HTMLImageElement>();
        this._image$ = this._imageChanged$.pipe(
            startWith(null),
            publishReplay(1),
            refCount());

        this._iamgeSubscription = this._image$.subscribe();

        this._sequenceEdgesChanged$ = new Subject<NavigationEdgeStatus>();
        this._sequenceEdges$ = this._sequenceEdgesChanged$.pipe(
            startWith(this._sequenceEdges),
            publishReplay(1),
            refCount());

        this._sequenceEdgesSubscription = this._sequenceEdges$.subscribe(() => { /*noop*/ });

        this._spatialEdgesChanged$ = new Subject<NavigationEdgeStatus>();
        this._spatialEdges$ = this._spatialEdgesChanged$.pipe(
            startWith(this._spatialEdges),
            publishReplay(1),
            refCount());

        this._spatialEdgesSubscription = this._spatialEdges$.subscribe(() => { /*noop*/ });

        this._cachingAssets$ = null;
    }

    /**
     * Get image.
     *
     * @description Will not be set when assets have not been cached
     * or when the object has been disposed.
     *
     * @returns {HTMLImageElement} Cached image element of the image.
     */
    public get image(): HTMLImageElement {
        return this._image;
    }

    /**
     * Get image$.
     *
     * @returns {Observable<HTMLImageElement>} Observable emitting
     * the cached image when it is updated.
     */
    public get image$(): Observable<HTMLImageElement> {
        return this._image$;
    }

    /**
     * Get mesh.
     *
     * @description Will not be set when assets have not been cached
     * or when the object has been disposed.
     *
     * @returns {MeshContract} SfM triangulated mesh of reconstructed
     * atomic 3D points.
     */
    public get mesh(): MeshContract {
        return this._mesh;
    }

    /**
     * Get sequenceEdges.
     *
     * @returns {NavigationEdgeStatus} Value describing the status of the
     * sequence edges.
     */
    public get sequenceEdges(): NavigationEdgeStatus {
        return this._sequenceEdges;
    }

    /**
     * Get sequenceEdges$.
     *
     * @returns {Observable<NavigationEdgeStatus>} Observable emitting
     * values describing the status of the sequence edges.
     */
    public get sequenceEdges$(): Observable<NavigationEdgeStatus> {
        return this._sequenceEdges$;
    }

    /**
     * Get spatialEdges.
     *
     * @returns {NavigationEdgeStatus} Value describing the status of the
     * spatial edges.
     */
    public get spatialEdges(): NavigationEdgeStatus {
        return this._spatialEdges;
    }

    /**
     * Get spatialEdges$.
     *
     * @returns {Observable<NavigationEdgeStatus>} Observable emitting
     * values describing the status of the spatial edges.
     */
    public get spatialEdges$(): Observable<NavigationEdgeStatus> {
        return this._spatialEdges$;
    }

    /**
     * Cache the image and mesh assets.
     *
     * @param {SpatialImageEnt} spatial - Spatial props of the image to cache.
     * @param {boolean} spherical - Value indicating whether image is a spherical.
     * @param {boolean} merged - Value indicating whether image is merged.
     * @returns {Observable<ImageCache>} Observable emitting this image
     * cache whenever the load status has changed and when the mesh or image
     * has been fully loaded.
     */
    public cacheAssets$(
        spatial: SpatialImageEnt,
        merged: boolean): Observable<ImageCache> {
        if (this._cachingAssets$ != null) {
            return this._cachingAssets$;
        }

        this._cachingAssets$ = observableCombineLatest(
            this._cacheImage$(spatial),
            this._cacheMesh$(spatial, merged)).pipe(
                map(
                    ([image, mesh]: [HTMLImageElement, MeshContract]): ImageCache => {
                        this._image = image;
                        this._mesh = mesh;

                        return this;
                    }),
                finalize(
                    (): void => {
                        this._cachingAssets$ = null;
                    }),
                publishReplay(1),
                refCount());

        this._cachingAssets$.pipe(
            first(
                (imageCache: ImageCache): boolean => {
                    return !!imageCache._image;
                }))
            .subscribe(
                (): void => {
                    this._imageChanged$.next(this._image);
                },
                (): void => { /*noop*/ });

        return this._cachingAssets$;
    }

    /**
     * Cache an image with a higher resolution than the current one.
     *
     * @param {SpatialImageEnt} spatial - Spatial props.
     * @returns {Observable<ImageCache>} Observable emitting a single item,
     * the image cache, when the image has been cached. If supplied image
     * size is not larger than the current image size the image cache is
     * returned immediately.
     */
    public cacheImage$(spatial: SpatialImageEnt): Observable<ImageCache> {
        if (this._image != null) { return observableOf<ImageCache>(this); }

        const cacheImage$ = this._cacheImage$(spatial)
            .pipe(
                first(
                    (image: HTMLImageElement): boolean => {
                        return !!image;
                    }),
                tap(
                    (image: HTMLImageElement): void => {
                        this._disposeImage();
                        this._image = image;
                    }),
                map(
                    (): ImageCache => {
                        return this;
                    }),
                publishReplay(1),
                refCount());

        cacheImage$
            .subscribe(
                (): void => {
                    this._imageChanged$.next(this._image);
                },
                (): void => { /*noop*/ });

        return cacheImage$;
    }

    /**
     * Cache the sequence edges.
     *
     * @param {Array<NavigationEdge>} edges - Sequence edges to cache.
     */
    public cacheSequenceEdges(edges: NavigationEdge[]): void {
        this._sequenceEdges = { cached: true, edges: edges };
        this._sequenceEdgesChanged$.next(this._sequenceEdges);
    }

    /**
     * Cache the spatial edges.
     *
     * @param {Array<NavigationEdge>} edges - Spatial edges to cache.
     */
    public cacheSpatialEdges(edges: NavigationEdge[]): void {
        this._spatialEdges = { cached: true, edges: edges };
        this._spatialEdgesChanged$.next(this._spatialEdges);
    }

    /**
     * Dispose the image cache.
     *
     * @description Disposes all cached assets and unsubscribes to
     * all streams.
     */
    public dispose(): void {
        this._iamgeSubscription.unsubscribe();
        this._sequenceEdgesSubscription.unsubscribe();
        this._spatialEdgesSubscription.unsubscribe();

        this._disposeImage();

        this._mesh = null;
        this._sequenceEdges = { cached: false, edges: [] };
        this._spatialEdges = { cached: false, edges: [] };

        this._imageChanged$.next(null);
        this._sequenceEdgesChanged$.next(this._sequenceEdges);
        this._spatialEdgesChanged$.next(this._spatialEdges);

        this._disposed = true;

        if (this._imageAborter != null) {
            this._imageAborter();
            this._imageAborter = null;
        }

        if (this._meshAborter != null) {
            this._meshAborter();
            this._meshAborter = null;
        }

    }

    /**
     * Reset the sequence edges.
     */
    public resetSequenceEdges(): void {
        this._sequenceEdges = { cached: false, edges: [] };
        this._sequenceEdgesChanged$.next(this._sequenceEdges);
    }

    /**
     * Reset the spatial edges.
     */
    public resetSpatialEdges(): void {
        this._spatialEdges = { cached: false, edges: [] };
        this._spatialEdgesChanged$.next(this._spatialEdges);
    }

    /**
     * Cache the image.
     *
     * @param {SpatialImageEnt} spatial - Spatial image.
     * @param {boolean} spherical - Value indicating whether image is a spherical.
     * @returns {Observable<ILoadStatusObject<HTMLImageElement>>} Observable
     * emitting a load status object every time the load status changes
     * and completes when the image is fully loaded.
     */
    private _cacheImage$(spatial: SpatialImageEnt): Observable<HTMLImageElement> {
        return Observable.create(
            (subscriber: Subscriber<HTMLImageElement>): void => {
                const abort = new Promise<void>(
                    (_, reject): void => {
                        this._imageAborter = reject;
                    });

                const url = spatial.thumb.url;
                if (!url) {
                    const thumbId = spatial.thumb.id;
                    const message =
                        `Incorrect thumb URL for ${spatial.id} ` +
                        `(${thumbId}, ${url})`;
                    subscriber.error(new Error(message));
                    return;
                }

                this._provider.getImageBuffer(url, abort)
                    .then(
                        (buffer: ArrayBuffer): void => {
                            this._imageAborter = null;

                            const image = new Image();
                            image.crossOrigin = "Anonymous";

                            image.onload = () => {
                                if (this._disposed) {
                                    window.URL.revokeObjectURL(image.src);
                                    const message =
                                        `Image load was aborted (${url})`;
                                    subscriber.error(new Error(message));
                                    return;
                                }

                                subscriber.next(image);
                                subscriber.complete();
                            };

                            image.onerror = () => {
                                this._imageAborter = null;

                                subscriber.error(
                                    new Error(
                                        `Failed to load image (${url})`));
                            };

                            const blob: Blob = new Blob([buffer]);
                            image.src = window.URL.createObjectURL(blob);
                        },
                        (error: Error): void => {
                            this._imageAborter = null;
                            subscriber.error(error);
                        });
            });
    }

    /**
     * Cache the mesh.
     *
     * @param {SpatialImageEnt} spatial - Spatial props.
     * @param {boolean} merged - Value indicating whether image is merged.
     * @returns {Observable<ILoadStatusObject<MeshContract>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the mesh is fully loaded.
     */
    private _cacheMesh$(spatial: SpatialImageEnt, merged: boolean): Observable<MeshContract> {
        return Observable.create(
            (subscriber: Subscriber<MeshContract>): void => {
                if (!merged) {
                    subscriber.next(this._createEmptyMesh());
                    subscriber.complete();
                    return;
                }

                const url = spatial.mesh.url;
                if (!url) {
                    const meshId = spatial.mesh.id;
                    const message =
                        `Incorrect mesh URL for ${spatial.id} ` +
                        `(${meshId}, ${url})`;
                    console.warn(message);
                    subscriber.next(this._createEmptyMesh());
                    subscriber.complete();
                    return;
                }

                const abort: Promise<void> = new Promise(
                    (_, reject): void => {
                        this._meshAborter = reject;
                    });

                this._provider.getMesh(url, abort)
                    .then(
                        (mesh: MeshContract): void => {
                            this._meshAborter = null;

                            if (this._disposed) {
                                return;
                            }

                            subscriber.next(mesh);
                            subscriber.complete();
                        },
                        (error: Error): void => {
                            this._meshAborter = null;
                            console.error(error);
                            subscriber.next(this._createEmptyMesh());
                            subscriber.complete();
                        });
            });
    }

    /**
     * Create a load status object with an empty mesh.
     *
     * @returns {ILoadStatusObject<MeshContract>} Load status object
     * with empty mesh.
     */
    private _createEmptyMesh(): MeshContract {
        return { faces: [], vertices: [] };
    }

    private _disposeImage(): void {
        if (this._image != null) {
            window.URL.revokeObjectURL(this._image.src);
        }

        this._image = null;
    }
}
