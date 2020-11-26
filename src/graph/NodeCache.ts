import { of as observableOf, combineLatest as observableCombineLatest, Subject, Observable, Subscriber, Subscription } from "rxjs";

import { map, tap, startWith, publishReplay, refCount, finalize, first } from "rxjs/operators";

import { IEdge } from "../Edge";
import {
    IEdgeStatus,
} from "../Graph";
import {
    Settings,
} from "../Utils";
import { ImageSize } from "../Viewer";
import IMesh from "../api/interfaces/IMesh";
import IDataProvider from "../api/interfaces/IDataProvider";
import INodeUrls from "../api/interfaces/INodeUrls";

/**
 * @class NodeCache
 *
 * @classdesc Represents the cached properties of a node.
 */
export class NodeCache {
    private _disposed: boolean;

    private _provider: IDataProvider;

    private _image: HTMLImageElement;
    private _mesh: IMesh;
    private _sequenceEdges: IEdgeStatus;
    private _spatialEdges: IEdgeStatus;

    private _imageAborter: Function;
    private _meshAborter: Function;

    private _imageChanged$: Subject<HTMLImageElement>;
    private _image$: Observable<HTMLImageElement>;
    private _sequenceEdgesChanged$: Subject<IEdgeStatus>;
    private _sequenceEdges$: Observable<IEdgeStatus>;
    private _spatialEdgesChanged$: Subject<IEdgeStatus>;
    private _spatialEdges$: Observable<IEdgeStatus>;

    private _cachingAssets$: Observable<NodeCache>;

    private _iamgeSubscription: Subscription;
    private _sequenceEdgesSubscription: Subscription;
    private _spatialEdgesSubscription: Subscription;

    /**
     * Create a new node cache instance.
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

        this._sequenceEdgesChanged$ = new Subject<IEdgeStatus>();
        this._sequenceEdges$ = this._sequenceEdgesChanged$.pipe(
            startWith(this._sequenceEdges),
            publishReplay(1),
            refCount());

        this._sequenceEdgesSubscription = this._sequenceEdges$.subscribe(() => { /*noop*/ });

        this._spatialEdgesChanged$ = new Subject<IEdgeStatus>();
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
     * @returns {HTMLImageElement} Cached image element of the node.
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
     * @returns {IMesh} SfM triangulated mesh of reconstructed
     * atomic 3D points.
     */
    public get mesh(): IMesh {
        return this._mesh;
    }

    /**
     * Get sequenceEdges.
     *
     * @returns {IEdgeStatus} Value describing the status of the
     * sequence edges.
     */
    public get sequenceEdges(): IEdgeStatus {
        return this._sequenceEdges;
    }

    /**
     * Get sequenceEdges$.
     *
     * @returns {Observable<IEdgeStatus>} Observable emitting
     * values describing the status of the sequence edges.
     */
    public get sequenceEdges$(): Observable<IEdgeStatus> {
        return this._sequenceEdges$;
    }

    /**
     * Get spatialEdges.
     *
     * @returns {IEdgeStatus} Value describing the status of the
     * spatial edges.
     */
    public get spatialEdges(): IEdgeStatus {
        return this._spatialEdges;
    }

    /**
     * Get spatialEdges$.
     *
     * @returns {Observable<IEdgeStatus>} Observable emitting
     * values describing the status of the spatial edges.
     */
    public get spatialEdges$(): Observable<IEdgeStatus> {
        return this._spatialEdges$;
    }

    /**
     * Cache the image and mesh assets.
     *
     * @param {string} key - Key of the node to cache.
     * @param {boolean} pano - Value indicating whether node is a panorama.
     * @param {boolean} merged - Value indicating whether node is merged.
     * @returns {Observable<NodeCache>} Observable emitting this node
     * cache whenever the load status has changed and when the mesh or image
     * has been fully loaded.
     */
    public cacheAssets$(nodeUrls: INodeUrls, pano: boolean, merged: boolean): Observable<NodeCache> {
        if (this._cachingAssets$ != null) {
            return this._cachingAssets$;
        }

        const imageSize: ImageSize = pano ?
            Settings.basePanoramaSize :
            Settings.baseImageSize;

        this._cachingAssets$ = observableCombineLatest(
            this._cacheImage$(nodeUrls, imageSize),
            this._cacheMesh$(nodeUrls, merged)).pipe(
                map(
                    ([image, mesh]: [HTMLImageElement, IMesh]): NodeCache => {
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
                (nodeCache: NodeCache): boolean => {
                    return !!nodeCache._image;
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
     * @param {INodeUrls} nodeUrls - Node URLs.
     * @param {ImageSize} imageSize - The size to cache.
     * @returns {Observable<NodeCache>} Observable emitting a single item,
     * the node cache, when the image has been cached. If supplied image
     * size is not larger than the current image size the node cache is
     * returned immediately.
     */
    public cacheImage$(nodeUrls: INodeUrls, imageSize: ImageSize): Observable<NodeCache> {
        if (this._image != null && imageSize <= Math.max(this._image.width, this._image.height)) {
            return observableOf<NodeCache>(this);
        }

        const cacheImage$: Observable<NodeCache> = this._cacheImage$(nodeUrls, imageSize).pipe(
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
                (): NodeCache => {
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
     * @param {Array<IEdge>} edges - Sequence edges to cache.
     */
    public cacheSequenceEdges(edges: IEdge[]): void {
        this._sequenceEdges = { cached: true, edges: edges };
        this._sequenceEdgesChanged$.next(this._sequenceEdges);
    }

    /**
     * Cache the spatial edges.
     *
     * @param {Array<IEdge>} edges - Spatial edges to cache.
     */
    public cacheSpatialEdges(edges: IEdge[]): void {
        this._spatialEdges = { cached: true, edges: edges };
        this._spatialEdgesChanged$.next(this._spatialEdges);
    }

    /**
     * Dispose the node cache.
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
     * @param {INodeUrls} nodeUrls - Node URLs.
     * @param {boolean} pano - Value indicating whether node is a panorama.
     * @returns {Observable<ILoadStatusObject<HTMLImageElement>>} Observable
     * emitting a load status object every time the load status changes
     * and completes when the image is fully loaded.
     */
    private _cacheImage$(nodeUrls: INodeUrls, imageSize: ImageSize): Observable<HTMLImageElement> {
        return Observable.create(
            (subscriber: Subscriber<HTMLImageElement>): void => {
                const abort: Promise<void> = new Promise(
                    (_, reject): void => {
                        this._imageAborter = reject;
                    });

                const url: string = this._getThumbUrl(nodeUrls, imageSize);
                this._provider.getImage(url, abort)
                    .then(
                        (buffer: ArrayBuffer): void => {
                            this._imageAborter = null;

                            const image: HTMLImageElement = new Image();
                            image.crossOrigin = "Anonymous";

                            image.onload = () => {
                                if (this._disposed) {
                                    window.URL.revokeObjectURL(image.src);
                                    subscriber.error(new Error(`Image load was aborted (${url})`));

                                    return;
                                }

                                subscriber.next(image);
                                subscriber.complete();
                            };

                            image.onerror = () => {
                                this._imageAborter = null;

                                subscriber.error(new Error(`Failed to load image (${url})`));
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
     * @param {INodeUrls} nodeUrls - Node URLs.
     * @param {boolean} merged - Value indicating whether node is merged.
     * @returns {Observable<ILoadStatusObject<IMesh>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the mesh is fully loaded.
     */
    private _cacheMesh$(nodeUrls: INodeUrls, merged: boolean): Observable<IMesh> {
        return Observable.create(
            (subscriber: Subscriber<IMesh>): void => {
                if (!merged) {
                    subscriber.next(this._createEmptyMesh());
                    subscriber.complete();
                    return;
                }

                const abort: Promise<void> = new Promise(
                    (_, reject): void => {
                        this._meshAborter = reject;
                    });

                this._provider.getMesh(nodeUrls.mesh_url, abort)
                    .then(
                        (mesh: IMesh): void => {
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
     * @returns {ILoadStatusObject<IMesh>} Load status object
     * with empty mesh.
     */
    private _createEmptyMesh(): IMesh {
        return { faces: [], vertices: [] };
    }

    private _disposeImage(): void {
        if (this._image != null) {
            window.URL.revokeObjectURL(this._image.src);
        }

        this._image = null;
    }

    private _getThumbUrl(nodeUrls: INodeUrls, size: ImageSize): string {
        switch (size) {
            case ImageSize.Size320:
                return nodeUrls.thumb320_url;
            case ImageSize.Size640:
                return nodeUrls.thumb640_url;
            case ImageSize.Size1024:
                return nodeUrls.thumb1024_url;
            default:
                return nodeUrls.thumb2048_url;
        }
    }
}

export default NodeCache;
