/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {IAPINavImIm} from "../API";
import {IEdge} from "../Edge";
import {ILatLon} from "../Geo";
import {IMesh, ILoadStatus, MeshReader, Sequence} from "../Graph";
import {Settings, Urls} from "../Utils";

interface ILoadStatusObject {
    loaded: ILoadStatus;
    object: any;
}

export class Node {
    public worthy: boolean;
    public cached: boolean;

    public lastCacheEvict: number;
    public lastUsed: number;

    private _apiNavImIm: IAPINavImIm;
    private _key: string;
    private _ca: number;
    private _latLon: ILatLon;
    private _sequence: Sequence;

    private _hs: string[];

    private _image: HTMLImageElement;
    private _mesh: IMesh;
    private _edges: IEdge[];

    private _loadStatus: ILoadStatus;

    constructor (
        ca: number,
        latLon: ILatLon,
        worthy: boolean,
        sequence: Sequence,
        apiNavImIm: IAPINavImIm,
        hs: string[]) {

        this._apiNavImIm = apiNavImIm;
        this._key = apiNavImIm.key;
        this._ca = ca;
        this._latLon = latLon;
        this._sequence = sequence;

        this._hs = hs;

        this._image = null;
        this._mesh = null;
        this._edges = null;

        this.worthy = worthy;
        this.cached = false;

        this.lastCacheEvict = 0;
        this.lastUsed = new Date().getTime();

        this._loadStatus = { loaded: 0, total: 100 };
    }

    public get apiNavImIm(): IAPINavImIm {
        return this._apiNavImIm;
    }

    public get user(): string {
        return this._apiNavImIm.user;
    }

    public get capturedAt(): number {
        return this._apiNavImIm.captured_at;
    }

    public get key(): string {
        return this._key;
    }

    public get ca(): number {
        return this._ca;
    }

    public get latLon(): ILatLon {
        return this._latLon;
    }

    public get sequence(): Sequence {
        return this._sequence;
    }

    public get hs(): string[] {
        return this._hs;
    }

    public get image(): HTMLImageElement {
        return this._image;
    }

    public get mesh(): IMesh {
        return this._mesh;
    }

    public get edges(): IEdge[] {
        return this._edges;
    }

    public set edges(value: IEdge[]) {
        this._edges = value;
    }

    public get loadStatus(): ILoadStatus {
        return this._loadStatus;
    }

    public get loaded(): boolean {
        return this.cached && this._image != null;
    }

    public get merged(): boolean {
        return this.apiNavImIm != null &&
            this.apiNavImIm.merge_version != null &&
            this.apiNavImIm.merge_version > 0;
    }

    public get pano(): boolean {
        return this.apiNavImIm.gpano != null &&
            this.apiNavImIm.gpano.FullPanoWidthPixels != null;
    }

    public get fullPano(): boolean {
        return this.apiNavImIm.gpano != null &&
            this.apiNavImIm.gpano.CroppedAreaLeftPixels === 0 &&
            this.apiNavImIm.gpano.CroppedAreaTopPixels === 0 &&
            this.apiNavImIm.gpano.CroppedAreaImageWidthPixels === this.apiNavImIm.gpano.FullPanoWidthPixels &&
            this.apiNavImIm.gpano.CroppedAreaImageHeightPixels === this.apiNavImIm.gpano.FullPanoHeightPixels;
    }

    public findNextKeyInSequence (): string {
        if (this.sequence === undefined) {
            return null;
        }
        return this.sequence.findNextKey(this.key);
    }

    public findPrevKeyInSequence (): string {
        if (this.sequence === undefined) {
            return null;
        }
        return this.sequence.findPrevKey(this.key);
    }

    public cacheAssets(): rx.Observable<Node> {
        return this.cacheImage().combineLatest(this.cacheMesh(), (image: ILoadStatusObject, mesh: ILoadStatusObject): Node => {
            this._loadStatus.loaded = 0;
            this._loadStatus.total = 0;

            if (mesh) {
                this._mesh = mesh.object;
                this._loadStatus.loaded += mesh.loaded.loaded;
                this._loadStatus.total += mesh.loaded.total;
            }

            if (image) {
                this._image = image.object;
                this._loadStatus.loaded += image.loaded.loaded;
                this._loadStatus.total += image.loaded.total;
            }

            return this;
        });
    }

    public cacheImage(): rx.Observable<ILoadStatusObject> {
        return rx.Observable.create<ILoadStatusObject>((observer: rx.Observer<ILoadStatusObject>): void => {
            let img: HTMLImageElement = new Image();
            img.crossOrigin = "Anonymous";

            if (process.env.MAPENV === "development") {
                observer.onNext({ loaded: {loaded: 1, total: 1}, object: this._image });
                observer.onCompleted();
                return;
            }

            let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
            xmlHTTP.open("GET", Urls.image(this.key, Settings.baseImageSize), true);
            xmlHTTP.responseType = "arraybuffer";
            xmlHTTP.onload = (e: any) => {
                img.onload = () => {
                    observer.onNext({ loaded: { loaded: e.loaded, total: e.total }, object: img });
                    observer.onCompleted();
                };

                img.onerror = (err: Event) => {
                    observer.onError(err);
                };

                let blob: Blob = new Blob([xmlHTTP.response]);
                img.src = window.URL.createObjectURL(blob);
            };
            xmlHTTP.onprogress = (e: any) => {
                observer.onNext({loaded: { loaded: e.loaded, total: e.total}, object: null });
            };
            xmlHTTP.send();
        });
    }

    public cacheMesh(): rx.Observable<ILoadStatusObject> {
        return rx.Observable.create<ILoadStatusObject>((observer: rx.Observer<ILoadStatusObject>): void => {
            if (process.env.MAPENV === "development") {
                observer.onNext({loaded: { loaded: 1, total: 1}, object: { faces: [[-1]], vertices: [[-1]] } });
                observer.onCompleted();
                return;
            }

            if (!this.merged) {
                let mesh: IMesh = { faces: [], vertices: [] };
                observer.onNext({ loaded: { loaded: 0, total: 0 }, object: mesh });
                observer.onCompleted();

                return;
            }

            let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
            xmlHTTP.open("GET", Urls.proto_mesh(this.key), true);
            xmlHTTP.responseType = "arraybuffer";
            xmlHTTP.onload = (e: any) => {
                let mesh: IMesh;
                if (xmlHTTP.status === 200) {
                    mesh = MeshReader.read(new Buffer(xmlHTTP.response));
                } else {
                    mesh = { faces: [], vertices: [] };
                }

                observer.onNext({ loaded: { loaded: e.loaded, total: e.total }, object: mesh });
                observer.onCompleted();
            };

            xmlHTTP.onprogress = (e: any) => {
                observer.onNext({ loaded: { loaded: e.loaded, total: e.total }, object: null });
            };

            xmlHTTP.send(null);
        });
    }
}

export default Node;
