/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/latlon-geohash/latlon-geohash.d.ts" />

import * as _ from "underscore";
// import * as geohash from "latlon-geohash";
import * as rx from "rx";

import {IAPINavIm, APIv2} from "../API";
import {IAPIVal, ICachedTile} from "../Graph";

export class TilesService {
    public cacheH: rx.Subject<string> = new rx.Subject<string>();
    public cacheIm: rx.Subject<string> = new rx.Subject<string>();

    public fetchedTiles: rx.Observable<{[key: string]: ICachedTile}>;

    public imTiles: rx.Observable<IAPIVal>;
    public hTiles: rx.Observable<IAPIVal>;

    private apiV2: APIv2;

    constructor (clientId: string) {
        this.apiV2 = new APIv2(clientId);

        this.imTiles = this.cacheIm.flatMap<IAPINavIm>((im: string): rx.Observable<IAPINavIm> => {
            return rx.Observable.fromPromise(this.apiV2.nav.im(im));
        }).filter((data: IAPINavIm): boolean => {
            return data != null;
        }).map<IAPIVal>((data: IAPINavIm): IAPIVal => {
            return {
                data: data,
                cacheFurther: true
            };
        });

        this.hTiles = this.cacheH.flatMap<IAPINavIm>((h: string): rx.Observable<IAPINavIm> => {
            return rx.Observable.fromPromise(this.apiV2.nav.h(h));
        }).filter((data: IAPINavIm): boolean => {
            return data != null;
        }).map<IAPIVal>((data: IAPINavIm): IAPIVal => {
            return {
                data: data,
                cacheFurther: false
            };
        });

        this.fetchedTiles = this.imTiles.merge(this.hTiles).scan<{[key: string]: ICachedTile}>(
        (tilesCache: {[key: string]: ICachedTile}, val: IAPIVal): {[key: string]: ICachedTile} => {
            let data: IAPINavIm = val.data;

            _.each(data.hs, (h: string) => {
                tilesCache[h] = {
                    key: h,
                    cached: true,
                    fetching: true,
                    lastUsed: new Date()
                };
            });

            return tilesCache;
        },
        {});

        this.fetchedTiles.subscribe((tilesCache: {[key: string]: ICachedTile}) => {
            console.log("CACHE!!");
            console.log(tilesCache);
            // if (val.cacheFurther) {
            //     _.each(geohash.neighbours(h), (nh: string): void => {
            //         if (tilesCache[nh] === undefined) {
            //             tilesCache[nh] = {
            //                 key: nh,
            //                 cached: false,
            //                 fetching: false,
            //                 lastUsed: new Date()
            //             };
            //         }
            //     });
            // }

            // _.each(tilesCache, (cachedTile: ICachedTile, key: string) => {
            //     console.log("AROUND AND AROUND");
            //     console.log(key);
            //     if (!cachedTile.cached && !cachedTile.fetching) {
            //         console.log(`Cache tile:${key}`);
            //         cachedTile.fetching = true;
            //         this.cacheH.onNext(key);
            //     }
            // });

        });
    }
}

export default TilesService;
