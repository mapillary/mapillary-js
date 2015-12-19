/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/latlon-geohash/latlon-geohash.d.ts" />

import * as _ from "underscore";
import * as geohash from "latlon-geohash";
import * as rx from "rx";

import {IAPINavIm, APIv2} from "../API";
import {CachedTile, Node, TilesCache} from "../Graph";

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

    constructor (clientId: string, cachedNode: rx.Observable<Node>) {
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

        cachedNode.subscribe((node: Node) => {
            let h: string = geohash.encode(node.latLon.lat, node.latLon.lon, 8);
            _.each(geohash.neighbours(h), (nh: string): void => {
                this.cacheH(nh);
            });
            this.cacheH(h);
        });
    }

    public cache(key: string): void {
        this.createIm.onNext(key);
    }

    public cacheH(key: string): rx.Observable<CachedTile> {
        return this.cachedTiles.skipWhile((tilesCache: TilesCache) => {
            let cachedTile: CachedTile = tilesCache.get(key);

            if (cachedTile === undefined) {
                console.log(key);
                this.createH.onNext(key);
                return true;
            }

            return false;
        }).map((tilesCache: TilesCache) => {
            return tilesCache.get(key);
        });
    }
}

export default TilesService;
