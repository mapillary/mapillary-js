/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

export class CachedAsset {
    public image: any;
    public mesh: any;

    public fetchingAssets: boolean;
    public cached: boolean;

    constructor () {
        this.image = null;
        this.mesh = null;

        this.fetchingAssets = false;
        this.cached = false;
    }

    public cacheAssets(key: string): rx.Observable<string> {
        this.fetchingAssets = true;
        return this.cacheImage(key);
    }

    public cacheImage(key: string): rx.Observable<string> {
        return rx.Observable.create<string>((observer: rx.Observer<string>): void => {
            let img: HTMLImageElement = new Image();
            img.crossOrigin = "Anonymous";

            img.onload = () => {
                this.image = img;
                observer.onNext(key);
                observer.onCompleted();
            };

            img.onerror = (err: Event) => {
                observer.onError(err);
            };

            img.src = "https://d1cuyjsrcm0gby.cloudfront.net/" + key + "/thumb-320.jpg?origin=mapillary.webgl";
        });
    }

    // public cacheMesh() {
    // }
}


export class AssetCache {
    private cachedAssets: {[key: string]: CachedAsset};

    constructor () {
        this.cachedAssets = {};
    }

    public get(key: string): CachedAsset {
        return this.cachedAssets[key];
    }

    public set(key: string, cachedAsset: CachedAsset): void {
        this.cachedAssets[key] = cachedAsset;
    }

    public getUncached(): {[key: string]: CachedAsset} {
        return _.pick(this.cachedAssets, (cachedAsset: CachedAsset, key: string): boolean => {
            return !cachedAsset.fetchingAssets;
        });
    }
}

export default AssetCache;
