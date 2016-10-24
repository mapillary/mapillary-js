import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/publishReplay";

import {IEdge} from "../Edge";
import {
    IEdgeStatus,
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
    private _sequenceEdges: IEdgeStatus;
    private _spatialEdges: IEdgeStatus;

    private _sequenceEdgesChanged$: Subject<IEdgeStatus>;
    private _sequenceEdges$: Observable<IEdgeStatus>;
    private _spatialEdgesChanged$: Subject<IEdgeStatus>;
    private _spatialEdges$: Observable<IEdgeStatus>;

    private _cachingAssets$: Observable<NewNodeCache>;

    private _sequenceEdgesSubscription: Subscription;
    private _spatialEdgesSubscription: Subscription;

    constructor() {
        this._image = null;
        this._loadStatus = { loaded: 0, total: 0 };
        this._mesh = null;
        this._sequenceEdges = { cached: false, edges: [] };
        this._spatialEdges = { cached: false, edges: [] };

        this._sequenceEdgesChanged$ = new Subject<IEdgeStatus>();
        this._sequenceEdges$ = this._sequenceEdgesChanged$
            .startWith(this._sequenceEdges)
            .publishReplay(1)
            .refCount();

        this._sequenceEdgesSubscription = this._sequenceEdges$.subscribe();

        this._spatialEdgesChanged$ = new Subject<IEdgeStatus>();
        this._spatialEdges$ = this._spatialEdgesChanged$
            .startWith(this._spatialEdges)
            .publishReplay(1)
            .refCount();

        this._spatialEdgesSubscription = this._spatialEdges$.subscribe();

        this._cachingAssets$ = null;
    }

    public get image(): HTMLImageElement {
        return this._image;
    }

    public get loadStatus(): ILoadStatus {
        return this._loadStatus;
    }

    public get mesh(): IMesh {
        return this._mesh;
    }

    public get sequenceEdges(): IEdgeStatus {
        return this._sequenceEdges;
    }

    public get sequenceEdges$(): Observable<IEdgeStatus> {
        return this._sequenceEdges$;
    }

    public get spatialEdges(): IEdgeStatus {
        return this._spatialEdges;
    }

    public get spatialEdges$(): Observable<IEdgeStatus> {
        return this._spatialEdges$;
    }

    public cacheAssets$(key: string, pano: boolean, merged: boolean): Observable<NewNodeCache> {
        if (this._cachingAssets$ != null) {
            return this._cachingAssets$;
        }

        this._cachingAssets$ = Observable
            .combineLatest(
                this._cacheImage(key, pano),
                this._cacheMesh(key, merged),
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
                })
            .finally(
                (): void => {
                    this._cachingAssets$ = null;
                })
            .publishReplay(1)
            .refCount();

        return this._cachingAssets$;
    }

    public cacheSequenceEdges(edges: IEdge[]): void {
        this._sequenceEdges = { cached: true, edges: edges };
        this._sequenceEdgesChanged$.next(this._sequenceEdges);
    }

    public cacheSpatialEdges(edges: IEdge[]): void {
        this._spatialEdges = { cached: true, edges: edges };
        this._spatialEdgesChanged$.next(this._spatialEdges);
    }

    public dispose(): void {
        this._sequenceEdgesSubscription.unsubscribe();
        this._spatialEdgesSubscription.unsubscribe();

        this._image = null;
        this._mesh = null;
        this._loadStatus = { loaded: 0, total: 0 };
        this._sequenceEdges = { cached: false, edges: [] };
        this._spatialEdges = { cached: false, edges: [] };

        this._sequenceEdgesChanged$.next(this._sequenceEdges);
        this._spatialEdgesChanged$.next(this._spatialEdges);
    }

    public resetSpatialEdges(): void {
        this._spatialEdges = { cached: false, edges: [] };
        this._spatialEdgesChanged$.next(this._spatialEdges);
    }

    /**
     * Cache the image.
     *
     * @returns {Observable<ILoadStatusObject<HTMLImageElement>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the image is fully loaded.
     */
    private _cacheImage(key: string, pano: boolean): Observable<ILoadStatusObject<HTMLImageElement>> {
        let imageSize: ImageSize = pano ?
            Settings.basePanoramaSize :
            Settings.baseImageSize;

        return ImageLoader.loadThumbnail(key, imageSize);
    }

    /**
     * Cache the mesh.
     *
     * @returns {Observable<ILoadStatusObject<IMesh>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the mesh is fully loaded.
     */
    private _cacheMesh(key: string, merged: boolean): Observable<ILoadStatusObject<IMesh>> {
        return Observable.create(
            (subscriber: Subscriber<ILoadStatusObject<IMesh>>): void => {
                if (!merged) {
                    subscriber.next(this._createEmptyLoadStatus());
                    subscriber.complete();
                    return;
                }

                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
                xmlHTTP.open("GET", Urls.protoMesh(key), true);
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

                xmlHTTP.onerror = (e: Event) => {
                    console.error(`Failed to cache mesh (${key})`);

                    subscriber.next(this._createEmptyLoadStatus());
                    subscriber.complete();
                };

                xmlHTTP.send(null);
            });
    }

    private _createEmptyLoadStatus(): ILoadStatusObject<IMesh> {
        return {
            loaded: { loaded: 0, total: 0 },
            object: { faces: [], vertices: [] },
        };
    }
}

export default NewNodeCache;
