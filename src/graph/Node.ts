import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";

import "rxjs/add/observable/combineLatest";

import {IAPINavImIm} from "../API";
import {IEdge} from "../Edge";
import {ILatLon} from "../Geo";
import {
    IMesh,
    ILoadStatus,
    ILoadStatusObject,
    ImageLoader,
    MeshReader,
    Sequence,
} from "../Graph";
import {
    Settings,
    Urls,
} from "../Utils";
import {ImageSize} from "../Viewer";

export class Node {
    private _apiNavImIm: IAPINavImIm;
    private _ca: number;
    private _hs: string[];
    private _latLon: ILatLon;
    private _sequence: Sequence;

    private _edges: IEdge[];
    private _image: HTMLImageElement;
    private _mesh: IMesh;

    private _loadStatus: ILoadStatus;

    private _worthy: boolean;

    constructor (
        ca: number,
        latLon: ILatLon,
        worthy: boolean,
        sequence: Sequence,
        apiNavImIm: IAPINavImIm,
        hs: string[]) {

        this._apiNavImIm = apiNavImIm;
        this._ca = ca;
        this._hs = hs;
        this._latLon = latLon;
        this._sequence = sequence;

        this._edges = null;
        this._image = null;
        this._mesh = null;

        this._loadStatus = { loaded: 0, total: 100 };

        this._worthy = worthy;
    }

    public get apiNavImIm(): IAPINavImIm {
        return this._apiNavImIm;
    }

    public get ca(): number {
        return this._ca;
    }

    public get edges(): IEdge[] {
        return this._edges;
    }

    public get edgesCached(): boolean {
        return this._edges != null;
    }

    public get fullPano(): boolean {
        return this.apiNavImIm.gpano != null &&
            this.apiNavImIm.gpano.CroppedAreaLeftPixels === 0 &&
            this.apiNavImIm.gpano.CroppedAreaTopPixels === 0 &&
            this.apiNavImIm.gpano.CroppedAreaImageWidthPixels === this.apiNavImIm.gpano.FullPanoWidthPixels &&
            this.apiNavImIm.gpano.CroppedAreaImageHeightPixels === this.apiNavImIm.gpano.FullPanoHeightPixels;
    }

    public get hs(): string[] {
        return this._hs;
    }

    public get image(): HTMLImageElement {
        return this._image;
    }

    public get key(): string {
        return this._apiNavImIm.key;
    }

    public get latLon(): ILatLon {
        return this._latLon;
    }

    public get loaded(): boolean {
        return this.edgesCached && this._image != null;
    }

    public get loadStatus(): ILoadStatus {
        return this._loadStatus;
    }

    public get merged(): boolean {
        return this.apiNavImIm != null &&
            this.apiNavImIm.merge_version != null &&
            this.apiNavImIm.merge_version > 0;
    }

    public get mesh(): IMesh {
        return this._mesh;
    }

    public get pano(): boolean {
        return this.apiNavImIm.gpano != null &&
            this.apiNavImIm.gpano.FullPanoWidthPixels != null;
    }

    public get sequence(): Sequence {
        return this._sequence;
    }

    public get worthy(): boolean {
        return this._worthy;
    }

    public cacheAssets(): Observable<Node> {
        return Observable
            .combineLatest(
                this._cacheImage(),
                this._cacheMesh(),
                (imageStatus: ILoadStatusObject<HTMLImageElement>, meshStatus: ILoadStatusObject<IMesh>): Node => {
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

    public cacheEdges(edges: IEdge[]): void {
        this._edges = edges;
    }

    public findNextKeyInSequence (): string {
        return this._sequence != null ?
            this.sequence.findNextKey(this._apiNavImIm.key) :
            null;
    }

    public findPrevKeyInSequence (): string {
        return this._sequence != null ?
            this.sequence.findPrevKey(this._apiNavImIm.key) :
            null;
    }

    public makeWorthy(): void {
        this._worthy = true;
    }

    private _cacheMesh(): Observable<ILoadStatusObject<IMesh>> {
        return Observable.create(
            (subscriber: Subscriber<ILoadStatusObject<IMesh>>): void => {
                if (!this.merged) {
                    subscriber.next({
                        loaded: { loaded: 0, total: 0 },
                        object: { faces: [], vertices: [] },
                    });
                    subscriber.complete();
                    return;
                }

                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
                xmlHTTP.open("GET", Urls.proto_mesh(this.key), true);
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

    private _cacheImage(): Observable<ILoadStatusObject<HTMLImageElement>> {
        let imageSize: ImageSize = this.pano ?
            Settings.basePanoramaSize :
            Settings.baseImageSize;

        return ImageLoader.load(this.key, imageSize);
    }
}

export default Node;
