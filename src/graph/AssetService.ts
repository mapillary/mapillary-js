/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {CachedAsset, AssetCache} from "../Graph";

interface ICacheChange {
    action: string;
    key: string;
}

interface IAssetOperation extends Function {
  (assetCache: AssetCache): AssetCache;
}

export class AssetService {
    public pristine: boolean;

    public newCache: rx.Subject<string> = new rx.Subject<string>();
    public create: rx.Subject<string> = new rx.Subject<string>();
    public cached: rx.Subject<string> = new rx.Subject<string>();
    public uncached: rx.Subject<string> = new rx.Subject<string>();

    public updates: rx.Subject<any> = new rx.Subject<any>();

    public cacheChanges: rx.Observable<ICacheChange>;

    public cachedNode: rx.Observable<string>;
    public unCachedNode: rx.Observable<string>;
    public cachedNodes: rx.Observable<AssetCache>;

    constructor () {
        this.pristine = true;

        this.cachedNodes = this.updates
            .scan<AssetCache>(
            (assetCache: AssetCache, operation: IAssetOperation): AssetCache => {
                return operation(assetCache);
            },
            new AssetCache())
            .shareReplay(1);

        this.create.map((key: string): IAssetOperation => {
            return (assetCache: AssetCache): AssetCache => {
                let cachedAsset: CachedAsset = assetCache.get(key);

                if (cachedAsset === undefined) {
                    cachedAsset = new CachedAsset();
                    assetCache.set(key, cachedAsset);
                }

                return assetCache;
            };
        }).subscribe(this.updates);

        this.cached.map((key: string) => {
            return (assetCache: AssetCache): AssetCache => {
                let cachedAsset: CachedAsset = assetCache.get(key);

                if (cachedAsset !== undefined) {
                    cachedAsset.fetchingAssets = false;
                    cachedAsset.cached = true;
                }

                return assetCache;
            };
        }).subscribe(this.updates);

        this.newCache.subscribe(this.create);

        this.cacheChanges = this.cachedNodes.flatMap<ICacheChange>((assetCache: AssetCache): rx.Observable<ICacheChange> => {
            let unCachedAssets: {[key: string]: CachedAsset} = assetCache.getUncached();
            let changes: rx.Observable<ICacheChange>[] = [];

            _.map(unCachedAssets, (cachedAsset: CachedAsset, key: string) => {
                let change: rx.Observable<ICacheChange> = cachedAsset.cacheAssets(key).map((key2: string): ICacheChange => {
                    return {action: "add", key: key2};
                });
                changes.push(change);
            });

            return changes[0];
        });

        this.cacheChanges.subscribe((change: ICacheChange) => {
            console.log(change);
        });

        this.cachedNode = this.cacheChanges.filter((cacheChange: ICacheChange): boolean => {
            return (cacheChange.action === "add");
        }).map<string>((cacheChange: ICacheChange): string => {
            return cacheChange.key;
        });

        // this.cachedNode.subscribe((key: string) => {
        //     console.log(`NODE CACHED ${key}`);
        // });

        // this.unCachedNode = this.cacheChanges.filter((cacheChange: ICacheChange): boolean => {
        //     return (cacheChange.action === "remove");
        // }).map<string>((cacheChange: ICacheChange): string => {
        //     return cacheChange.key;
        // });

    }

    public cache(key: string): rx.Observable<string> {
        let ret: rx.Observable<string> = this.cachedNodes.skipWhile((assetCache: AssetCache): boolean => {
            let cachedAsset: CachedAsset = assetCache.get(key);
            if (cachedAsset === undefined) {
                return true;
            } else {
                return false;
            }
        }).map((assetCache: AssetCache): string => {
            return key;
        });

        if (this.pristine) {
            this.newCache.onNext(key);
            this.pristine = false;
        }

        return ret;
    }
}

export default AssetService;
