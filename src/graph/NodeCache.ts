import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import {IEdge} from "../Edge";
import {
    IMesh,
    ILoadStatus,
    ILoadStatusObject,
    ImageLoader,
    MeshReader,
} from "../Graph";
import {
    Settings,
    Urls,
} from "../Utils";
import {ImageSize} from "../Viewer";

export class NewNodeCache {
    private _image: HTMLImageElement;
    private _loadStatus: ILoadStatus;
    private _mesh: IMesh;
    private _sequenceEdgesCached: boolean;
    private _spatialEdgesCached: boolean;

    private _imageChanged$: Subject<HTMLImageElement>;
    private _image$: Observable<HTMLImageElement>;
    private _sequenceEdgesChanged$: Subject<IEdge[]>;
    private _sequenceEdges$: Observable<IEdge[]>;
    private _spatialEdgesChanged$: Subject<IEdge[]>;
    private _spatialEdges$: Observable<IEdge[]>;

    private _imageSubscription: Subscription;
    private _sequenceEdgesSubscription: Subscription;
    private _spatialEdgesSubscription: Subscription;

    constructor() {
        this._image = null;
        this._loadStatus = { loaded: 0, total: 0 };
        this._mesh = null;
        this._sequenceEdgesCached = false;
        this._spatialEdgesCached = false;

        this._imageChanged$ = new Subject<HTMLImageElement>();
        this._image$ = this._imageChanged$
            .publishReplay(1)
            .refCount();

        this._imageSubscription = this._image$.subscribe();

        this._sequenceEdgesChanged$ = new Subject<IEdge[]>();
        this._sequenceEdges$ = this._sequenceEdgesChanged$
            .publishReplay(1)
            .refCount();

        this._sequenceEdgesSubscription = this._sequenceEdges$.subscribe();

        this._spatialEdgesChanged$ = new Subject<IEdge[]>();
        this._spatialEdges$ = this._spatialEdgesChanged$
            .publishReplay(1)
            .refCount();

        this._spatialEdgesSubscription = this._spatialEdges$.subscribe();
    }

    public get image(): HTMLImageElement {
        return this._image;
    }

    public get image$(): Observable<HTMLImageElement> {
        return this._image$;
    }

    public get loadStatus(): ILoadStatus {
        return this._loadStatus;
    }

    public get mesh(): IMesh {
        return this._mesh;
    }

    public get sequenceEdgesCached(): boolean {
        return this._sequenceEdgesCached;
    }

    public get sequenceEdges$(): Observable<IEdge[]> {
        return this._sequenceEdges$;
    }

    public get spatialEdgesCached(): boolean {
        return this._spatialEdgesCached;
    }

    public get spatialEdges$(): Observable<IEdge[]> {
        return this._spatialEdges$;
    }

    public cacheAssets$(key: string, pano: boolean, merged: boolean): Observable<NewNodeCache> {
        return Observable
            .combineLatest(
                this.cacheImage(key, pano),
                this.cacheMesh(key, merged),
                (imageStatus: ILoadStatusObject<HTMLImageElement>, meshStatus: ILoadStatusObject<IMesh>): NewNodeCache => {
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
                });
    }

    /**
     * Cache the mesh.
     *
     * @returns {Observable<ILoadStatusObject<IMesh>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the mesh is fully loaded.
     */
    public cacheMesh(key: string, merged: boolean): Observable<ILoadStatusObject<IMesh>> {
        return Observable.create(
            (subscriber: Subscriber<ILoadStatusObject<IMesh>>): void => {
                if (!merged) {
                    subscriber.next({
                        loaded: { loaded: 0, total: 0 },
                        object: { faces: [], vertices: [] },
                    });
                    subscriber.complete();
                    return;
                }

                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
                xmlHTTP.open("GET", Urls.proto_mesh(key), true);
                xmlHTTP.responseType = "arraybuffer";
                xmlHTTP.onload = (pe: ProgressEvent) => {
                    let mesh: IMesh = xmlHTTP.status === 200 ?
                        MeshReader.read(new Buffer(xmlHTTP.response)) :
                        { faces: [], vertices: [] };

                    subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: mesh });
                    subscriber.complete();
                };

                xmlHTTP.onprogress = (pe: ProgressEvent) => {
                    subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: null });
                };

                xmlHTTP.send(null);
            });
    }

    /**
     * Cache the image.
     *
     * @returns {Observable<ILoadStatusObject<HTMLImageElement>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the image is fully loaded.
     */
    public cacheImage(key: string, pano: boolean): Observable<ILoadStatusObject<HTMLImageElement>> {
        let imageSize: ImageSize = pano ?
            Settings.basePanoramaSize :
            Settings.baseImageSize;

        return ImageLoader.loadThumbnail(key, imageSize);
    }

    public cacheSequenceEdges(edges: IEdge[]): void {
        this._sequenceEdgesCached = true;
        this._sequenceEdgesChanged$.next(edges);
    }

    public cacheSpatialEdges(edges: IEdge[]): void {
        this._spatialEdgesCached = true;
        this._spatialEdgesChanged$.next(edges);
    }

    public dispose(): void {
        this._image = null;
        this._mesh = null;
        this._loadStatus = { loaded: 0, total: 0 };
        this._sequenceEdgesCached = false;
        this._spatialEdgesCached = false;

        this._imageChanged$.next(null);
        this._sequenceEdgesChanged$.next([]);

        this._imageSubscription.unsubscribe();
        this._sequenceEdgesSubscription.unsubscribe();
        this._spatialEdgesSubscription.unsubscribe();
    }
}

export default NewNodeCache;
