/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/rest/rest.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import {IAPINavImIm} from "../API";
import {IEdge} from "../Edge";
import {ILatLon, IMesh} from "../Graph";
import Sequence from "./Sequence";

import * as rx from "rx";
import * as rest from "rest";
import * as mime from "rest/interceptor/mime";

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

    constructor (
        key: string,
        ca: number,
        latLon: ILatLon,
        worthy: boolean,
        sequence: Sequence,
        apiNavImIm: IAPINavImIm,
        translation: number[]) {
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
    }

    public cacheAssets(): rx.Observable<Node> {
        return this.cacheImage().zip(this.cacheMesh(), (n1: Node, n2: Node): Node => {
            return n1;
        });
    }

    public cacheImage(): rx.Observable<Node> {
        return rx.Observable.create<Node>((observer: rx.Observer<Node>): void => {
            let img: HTMLImageElement = new Image();

            if (process.env.MAPENV === "development") {
                this.image = "fakeIm";
                observer.onNext(this);
                observer.onCompleted();
                return;
            }

            img.crossOrigin = "Anonymous";

            img.onload = () => {
                this.image = img;
                observer.onNext(this);
                observer.onCompleted();
            };

            img.onerror = (err: Event) => {
                observer.onError(err);
            };

            img.src = "https://d1cuyjsrcm0gby.cloudfront.net/" + this.key + "/thumb-320.jpg?origin=mapillary.webgl";
        });
    }

    public cacheMesh(): rx.Observable<Node> {
        return rx.Observable.create<Node>((observer: rx.Observer<Node>): void => {
            if (process.env.MAPENV === "development") {
                this.mesh = { faces: [[-1]], vertices: [[-1]] };
                observer.onNext(this);
                observer.onCompleted();
                return;
            }

            let client: rest.Client = rest.wrap(mime);
            client("https://d1cuyjsrcm0gby.cloudfront.net/" + this.key + "/sfm/v1.0/atomic_mesh.json").entity().then(
            (data: any) => {
                this.mesh = <IMesh>JSON.parse(data)[this.key];
                observer.onNext(this);
                observer.onCompleted();
            },
            (error: Error) => {
                observer.onNext(this);
                observer.onCompleted();
            });
            return;
        });
    }

    public get merged(): boolean {
        return this.apiNavImIm != null &&
            this.apiNavImIm.merge_version != null &&
            this.apiNavImIm.merge_version > 0;
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
