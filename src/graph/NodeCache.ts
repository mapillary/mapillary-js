import {of as observableOf, combineLatest as observableCombineLatest, Subject, Observable, Subscriber, Subscription} from "rxjs";

import {map, tap, startWith, publishReplay, refCount, finalize, first} from "rxjs/operators";

import {IEdge} from "../Edge";
import {
    IEdgeStatus,
    IMesh,
    ILoadStatus,
    ILoadStatusObject,
    MeshReader,
} from "../Graph";
import {
    Settings,
    Urls,
} from "../Utils";
import {ImageSize} from "../Viewer";

/**
 * @class NodeCache
 *
 * @classdesc Represents the cached properties of a node.
 */
export class NodeCache {
    private _disposed: boolean;

    private _image: HTMLImageElement;
    private _loadStatus: ILoadStatus;
    private _mesh: IMesh;
    private _sequenceEdges: IEdgeStatus;
    private _spatialEdges: IEdgeStatus;

    private _imageRequest: XMLHttpRequest;
    private _meshRequest: XMLHttpRequest;

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
    constructor() {
        this._disposed = false;

        this._image = null;
        this._loadStatus = { loaded: 0, total: 0 };
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
     * Get loadStatus.
     *
     * @returns {ILoadStatus} Value indicating the load status
     * of the mesh and image.
     */
    public get loadStatus(): ILoadStatus {
        return this._loadStatus;
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
    public cacheAssets$(key: string, pano: boolean, merged: boolean): Observable<NodeCache> {
        if (this._cachingAssets$ != null) {
            return this._cachingAssets$;
        }

        let imageSize: ImageSize = pano ?
            Settings.basePanoramaSize :
            Settings.baseImageSize;

        this._cachingAssets$ = observableCombineLatest(
                this._cacheImage$(key, imageSize),
                this._cacheMesh$(key, merged)).pipe(
            map(
                ([imageStatus, meshStatus]: [ILoadStatusObject<HTMLImageElement>, ILoadStatusObject<IMesh>]): NodeCache => {
                    this._loadStatus.loaded = 0;
                    this._loadStatus.total = 0;

                    if (meshStatus) {
                        this._mesh = meshStatus.object;
                        this._loadStatus.loaded += meshStatus.loaded.loaded;
                        this._loadStatus.total += meshStatus.loaded.total;
                    }

                    if (imageStatus) {
                        this._image = imageStatus.object;
                        this._loadStatus.loaded += imageStatus.loaded.loaded;
                        this._loadStatus.total += imageStatus.loaded.total;
                    }

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
                (nodeCache: NodeCache): void => {
                    this._imageChanged$.next(this._image);
                },
                (error: Error): void => { /*noop*/ });

        return this._cachingAssets$;
    }

    /**
     * Cache an image with a higher resolution than the current one.
     *
     * @param {string} key - Key of the node to cache.
     * @param {ImageSize} imageSize - The size to cache.
     * @returns {Observable<NodeCache>} Observable emitting a single item,
     * the node cache, when the image has been cached. If supplied image
     * size is not larger than the current image size the node cache is
     * returned immediately.
     */
    public cacheImage$(key: string, imageSize: ImageSize): Observable<NodeCache> {
        if (this._image != null && imageSize <= Math.max(this._image.width, this._image.height)) {
            return observableOf<NodeCache>(this);
        }

        const cacheImage$: Observable<NodeCache> = this._cacheImage$(key, imageSize).pipe(
            first(
                (status: ILoadStatusObject<HTMLImageElement>): boolean => {
                    return status.object != null;
                }),
            tap(
                (status: ILoadStatusObject<HTMLImageElement>): void => {
                    this._disposeImage();
                    this._image = status.object;
                }),
            map(
                (imageStatus: ILoadStatusObject<HTMLImageElement>): NodeCache => {
                    return this;
                }),
            publishReplay(1),
            refCount());

        cacheImage$
            .subscribe(
                (nodeCache: NodeCache): void => {
                    this._imageChanged$.next(this._image);
                },
                (error: Error): void => { /*noop*/ });

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
        this._loadStatus.loaded = 0;
        this._loadStatus.total = 0;
        this._sequenceEdges = { cached: false, edges: [] };
        this._spatialEdges = { cached: false, edges: [] };

        this._imageChanged$.next(null);
        this._sequenceEdgesChanged$.next(this._sequenceEdges);
        this._spatialEdgesChanged$.next(this._spatialEdges);

        this._disposed = true;

        if (this._imageRequest != null) {
            this._imageRequest.abort();
        }

        if (this._meshRequest != null) {
            this._meshRequest.abort();
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
     * @param {string} key - Key of the node to cache.
     * @param {boolean} pano - Value indicating whether node is a panorama.
     * @returns {Observable<ILoadStatusObject<HTMLImageElement>>} Observable
     * emitting a load status object every time the load status changes
     * and completes when the image is fully loaded.
     */
    private _cacheImage$(key: string, imageSize: ImageSize): Observable<ILoadStatusObject<HTMLImageElement>> {
        return Observable.create(
            (subscriber: Subscriber<ILoadStatusObject<HTMLImageElement>>): void => {
                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
                xmlHTTP.open("GET", Urls.thumbnail(key, imageSize, Urls.origin), true);
                xmlHTTP.responseType = "arraybuffer";
                xmlHTTP.timeout = 15000;

                xmlHTTP.onload = (pe: ProgressEvent) => {
                    if (xmlHTTP.status !== 200) {
                        this._imageRequest = null;

                        subscriber.error(
                            new Error(`Failed to fetch image (${key}). Status: ${xmlHTTP.status}, ${xmlHTTP.statusText}`));

                        return;
                    }

                    let image: HTMLImageElement = new Image();
                    image.crossOrigin = "Anonymous";

                    image.onload = (e: Event) => {
                        this._imageRequest = null;

                        if (this._disposed) {
                            window.URL.revokeObjectURL(image.src);
                            subscriber.error(new Error(`Image load was aborted (${key})`));

                            return;
                        }

                        subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: image });
                        subscriber.complete();
                    };

                    image.onerror = (error: ErrorEvent) => {
                        this._imageRequest = null;

                        subscriber.error(new Error(`Failed to load image (${key})`));
                    };

                    let blob: Blob = new Blob([xmlHTTP.response]);
                    image.src = window.URL.createObjectURL(blob);
                };

                xmlHTTP.onprogress = (pe: ProgressEvent) => {
                    if (this._disposed) {
                        return;
                    }

                    subscriber.next({loaded: { loaded: pe.loaded, total: pe.total }, object: null });
                };

                xmlHTTP.onerror = (error: Event) => {
                    this._imageRequest = null;

                    subscriber.error(new Error(`Failed to fetch image (${key})`));
                };

                xmlHTTP.ontimeout = (e: Event) => {
                    this._imageRequest = null;

                    subscriber.error(new Error(`Image request timed out (${key})`));
                };

                xmlHTTP.onabort = (event: Event) => {
                    this._imageRequest = null;

                    subscriber.error(new Error(`Image request was aborted (${key})`));
                };

                this._imageRequest = xmlHTTP;

                xmlHTTP.send(null);
            });
    }

    /**
     * Cache the mesh.
     *
     * @param {string} key - Key of the node to cache.
     * @param {boolean} merged - Value indicating whether node is merged.
     * @returns {Observable<ILoadStatusObject<IMesh>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the mesh is fully loaded.
     */
    private _cacheMesh$(key: string, merged: boolean): Observable<ILoadStatusObject<IMesh>> {
        return Observable.create(
            (subscriber: Subscriber<ILoadStatusObject<IMesh>>): void => {
                if (!merged) {
                    subscriber.next(this._createEmptyMeshLoadStatus());
                    subscriber.complete();
                    return;
                }

                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
                xmlHTTP.open("GET", Urls.protoMesh(key), true);
                xmlHTTP.responseType = "arraybuffer";
                xmlHTTP.timeout = 15000;

                xmlHTTP.onload = (pe: ProgressEvent) => {
                    this._meshRequest = null;

                    if (this._disposed) {
                        return;
                    }

                    let mesh: IMesh = xmlHTTP.status === 200 ?
                        MeshReader.read(new Buffer(xmlHTTP.response)) :
                        { faces: [], vertices: [] };

                    subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: mesh });
                    subscriber.complete();
                };

                xmlHTTP.onprogress = (pe: ProgressEvent) => {
                    if (this._disposed) {
                        return;
                    }

                    subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: null });
                };

                xmlHTTP.onerror = (e: Event) => {
                    this._meshRequest = null;

                    console.error(`Failed to cache mesh (${key})`);

                    subscriber.next(this._createEmptyMeshLoadStatus());
                    subscriber.complete();
                };

                xmlHTTP.ontimeout = (e: Event) => {
                    this._meshRequest = null;

                    console.error(`Mesh request timed out (${key})`);

                    subscriber.next(this._createEmptyMeshLoadStatus());
                    subscriber.complete();
                };

                xmlHTTP.onabort = (e: Event) => {
                    this._meshRequest = null;

                    subscriber.error(new Error(`Mesh request was aborted (${key})`));
                };

                this._meshRequest = xmlHTTP;

                xmlHTTP.send(null);
            });
    }

    /**
     * Create a load status object with an empty mesh.
     *
     * @returns {ILoadStatusObject<IMesh>} Load status object
     * with empty mesh.
     */
    private _createEmptyMeshLoadStatus(): ILoadStatusObject<IMesh> {
        return {
            loaded: { loaded: 0, total: 0 },
            object: { faces: [], vertices: [] },
        };
    }

    private _disposeImage(): void {
        if (this._image != null) {
            window.URL.revokeObjectURL(this._image.src);
        }

        this._image = null;
    }
}

export default NodeCache;
