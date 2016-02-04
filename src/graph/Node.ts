/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/rest/rest.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import {IAPINavImIm} from "../API";
import {IEdge} from "../Edge";
import {ILatLon, IMesh, ILoadStatus, Sequence} from "../Graph";
import {Settings, Urls} from "../Utils";

import * as rx from "rx";

interface ILoadStatusObject {
    loaded: ILoadStatus;
    object: any;
}

export class Node {
    public key: string;
    public user: string;
    public capturedAt: number;
    public ca: number;
    public latLon: ILatLon;
    public worthy: boolean;
    public sequence: Sequence;
    public apiNavImIm: IAPINavImIm;
    public translation: number[];
    public cached: boolean;
    public lastCacheEvict: number;
    public lastUsed: number;

    public image: any;
    public mesh: IMesh;
    public edges: IEdge[];

    public hs: string[];

    public loadStatus: ILoadStatus;

    constructor (
        key: string,
        ca: number,
        latLon: ILatLon,
        worthy: boolean,
        sequence: Sequence,
        apiNavImIm: IAPINavImIm,
        translation: number[],
        hs: string[]) {
        this.key = key;
        this.ca = ca;
        this.latLon = latLon;
        this.worthy = worthy;
        this.sequence = sequence;
        this.apiNavImIm = apiNavImIm;
        this.translation = translation;
        this.cached = false;
        this.lastCacheEvict = 0;
        this.lastUsed = new Date().getTime();

        this.hs = hs;

        this.loadStatus = {loaded: 0, total: 100};
    }

    public cacheAssets(): rx.Observable<Node> {
        return this.cacheImage().combineLatest(this.cacheMesh(), (image: ILoadStatusObject, mesh: ILoadStatusObject): Node => {
            this.loadStatus.loaded = 0;
            this.loadStatus.total = 0;

            if (mesh) {
                this.mesh = mesh.object;
                this.loadStatus.loaded += mesh.loaded.loaded;
                this.loadStatus.total += mesh.loaded.total;
            }
            if (image) {
                this.image = image.object;
                this.loadStatus.loaded += image.loaded.loaded;
                this.loadStatus.total += image.loaded.total;
            }
            return this;
        });
    }

    public cacheImage(): rx.Observable<ILoadStatusObject> {
        return rx.Observable.create<ILoadStatusObject>((observer: rx.Observer<ILoadStatusObject>): void => {
            let img: HTMLImageElement = new Image();
            img.crossOrigin = "Anonymous";

            if (process.env.MAPENV === "development") {
                observer.onNext({loaded: {loaded: 1, total: 1}, object: this.image});
                observer.onCompleted();
                return;
            }

            let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
            xmlHTTP.open("GET", Urls.image(this.key, Settings.baseImageSize), true);
            xmlHTTP.responseType = "arraybuffer";
            xmlHTTP.onload = (e: any) => {
                img.onload = () => {
                    observer.onNext({loaded: {loaded: e.loaded, total: e.total}, object: img});
                    observer.onCompleted();
                };

                img.onerror = (err: Event) => {
                    observer.onError(err);
                };

                let blob: Blob = new Blob([xmlHTTP.response]);
                img.src = window.URL.createObjectURL(blob);
            };
            xmlHTTP.onprogress = (e: any) => {
                observer.onNext({loaded: {loaded: e.loaded, total: e.total}, object: null});
            };
            xmlHTTP.send();
        });
    }

    public cacheMesh(): rx.Observable<ILoadStatusObject> {
        return rx.Observable.create<ILoadStatusObject>((observer: rx.Observer<ILoadStatusObject>): void => {
            if (process.env.MAPENV === "development") {
                observer.onNext({loaded: {loaded: 1, total: 1}, object: { faces: [[-1]], vertices: [[-1]] }});
                observer.onCompleted();
                return;
            }

            if (!this.merged) {
                let mesh: IMesh = { faces: [], populated: false, vertices: [] };
                observer.onNext({ loaded: { loaded: 0, total: 0 }, object: mesh });
                observer.onCompleted();

                return;
            }

            let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
            xmlHTTP.open("GET", Urls.mesh(this.key), true);
            xmlHTTP.responseType = "text";
            xmlHTTP.onload = (e: any) => {
                let mesh: IMesh = <IMesh>JSON.parse(xmlHTTP.responseText)[this.key];
                if (mesh == null) {
                    mesh = { faces: [], populated: false, vertices: [] };
                } else {
                    mesh.populated = true;
                }

                observer.onNext({ loaded: {loaded: e.loaded, total: e.total }, object: mesh });
                observer.onCompleted();
            };

            xmlHTTP.onprogress = (e: any) => {
                observer.onNext({ loaded: { loaded: e.loaded, total: e.total }, object: null});
            };

            xmlHTTP.send();
        });
    }

    public get loaded(): boolean {
        return this.cached && this.image != null;
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
}

export default Node;
