/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import {IAPINavImIm} from "../API";
import {ILatLon} from "../Graph";
import Sequence from "./Sequence";

import * as rx from "rx";

export class Node {
    public key: string;
    public ca: number;
    public latLon: ILatLon;
    public worthy: boolean;
    public sequence: Sequence;
    public apiNavImIm: IAPINavImIm;
    public translation: number[];
    public cached: boolean;

    public image: any;
    public mesh: any;

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
    }

    public cacheAssets(): rx.Observable<Node> {
        return this.cacheImage();
    }

    public cacheImage(): rx.Observable<Node> {
        return rx.Observable.create<Node>((observer: rx.Observer<Node>): void => {
            let img: HTMLImageElement = new Image();

            if (process.env.MAPENV === "development") {
                this.image = "fake";
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
