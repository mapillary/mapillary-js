/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/latlon-geohash/latlon-geohash.d.ts" />

import * as _ from "underscore";
// import * as geohash from "latlon-geohash";
import * as rx from "rx";

import {IAPINavIm, APIv2} from "../API";
import {CachedTile, TilesCache} from "../Graph";

interface ITilesOperation extends Function {
    (tilesCache: TilesCache): TilesCache;
}

export class TilesService {
    public updates: rx.Subject<any> = new rx.Subject<any>();

    public createH: rx.Subject<string> = new rx.Subject<string>();
    public createIm: rx.Subject<string> = new rx.Subject<string>();

    public cachedTiles: rx.Observable<TilesCache>;

    public imTiles: rx.Observable<IAPINavIm>;
    public hTiles: rx.Observable<IAPINavIm>;

    private apiV2: APIv2;

    constructor (clientId: string) {
        this.apiV2 = new APIv2(clientId);

        this.imTiles = this.createIm.flatMap<IAPINavIm>((im: string): rx.Observable<IAPINavIm> => {
            return rx.Observable.fromPromise(this.apiV2.nav.im(im));
        });

        this.hTiles = this.createH.flatMap<IAPINavIm>((h: string): rx.Observable<IAPINavIm> => {
            return rx.Observable.fromPromise(this.apiV2.nav.h(h));
        });

        this.cachedTiles = this.updates
            .scan<TilesCache>(
            (tilesCache: TilesCache, operation: ITilesOperation): TilesCache => {
                return operation(tilesCache);
            },
            new TilesCache())
            .shareReplay(1);

        this.imTiles.merge(this.hTiles).map((data: IAPINavIm): ITilesOperation => {
            return (tilesCache: TilesCache): TilesCache => {
                _.each(data.hs, (h: string) => {
                    let cachedTile: CachedTile = new CachedTile(true, true);
                    tilesCache.set(h, cachedTile);
                });

                return tilesCache;
            };
        }).subscribe(this.updates);

        // this.fetchedTiles.subscribe((tilesCache: {[key: string]: ICachedTile}) => {
        //     console.log("PREDICT HERE");
        //     // console.log(tilesCache);
        //     // if (val.cacheFurther) {
        //     //     _.each(geohash.neighbours(h), (nh: string): void => {
        //     //         if (tilesCache[nh] === undefined) {
        //     //             tilesCache[nh] = {
        //     //                 key: nh,
        //     //                 cached: false,
        //     //                 fetching: false,
        //     //                 lastUsed: new Date()
        //     //             };
        //     //         }
        //     //     });
        //     // }
        //
        //     // _.each(tilesCache, (cachedTile: ICachedTile, key: string) => {
        //     //     console.log("AROUND AND AROUND");
        //     //     console.log(key);
        //     //     if (!cachedTile.cached && !cachedTile.fetching) {
        //     //         console.log(`Cache tile:${key}`);
        //     //         cachedTile.fetching = true;
        //     //         this.cacheH.onNext(key);
        //     //     }
        //     // });
        //
        // });
    }

    public cache(key: string): void {
        this.createIm.onNext(key);
    }
}

export default TilesService;
