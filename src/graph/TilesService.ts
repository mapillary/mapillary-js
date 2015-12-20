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

    public scheduleH: rx.Subject<string> = new rx.Subject<string>();

    public createH: rx.Subject<string> = new rx.Subject<string>();
    public createIm: rx.Subject<string> = new rx.Subject<string>();

    public cacheNode: rx.Subject<Node> = new rx.Subject<Node>();
    public createCacheNode: rx.Subject<Node> = new rx.Subject<Node>();
    public cachedTiles: rx.Observable<TilesCache>;

    public imTiles: rx.Observable<IAPINavIm>;
    public hTiles: rx.Observable<IAPINavIm>;

    private apiV2: APIv2;

    constructor (clientId: string) {
        this.apiV2 = new APIv2(clientId);

        this.scheduleH.map((h: string) => {
            return (tilesCache: TilesCache): TilesCache => {
                let cachedTile: CachedTile = tilesCache.get(h);
                if (cachedTile === undefined) {
                    tilesCache.set(h, new CachedTile(true, false));
                    this.createH.onNext(h);
                } else if (!cachedTile.fetching && !cachedTile.cached) {
                    cachedTile.fetching = true;
                    this.createH.onNext(h);
                }
                return tilesCache;
            };
        }).subscribe(this.updates);

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
                    console.log(`save tile ${h}`);
                    let cachedTile: CachedTile = tilesCache.get(h);
                    if (cachedTile === undefined) {
                        tilesCache.set(h, new CachedTile(true, true));
                    } else {
                        cachedTile.fetching = false;
                        cachedTile.cached = true;
                    }
                });

                return tilesCache;
            };
        }).subscribe(this.updates);

        this.createCacheNode.flatMap<string>((node: Node): rx.Observable<string> => {
            let hs: string[] = [];

            let h: string = geohash.encode(node.latLon.lat, node.latLon.lon, 7);
            hs.push(h);

            _.each(geohash.neighbours(h), (nh: string): void => {
                hs.push(nh);
            });

            return rx.Observable.from(hs);
        }).combineLatest(this.cachedTiles, (h: string, tilesCache: TilesCache) => {
            let cachedTile: CachedTile = tilesCache.get(h);
            if (cachedTile === undefined) {
                console.log(`cahching tile ${h}`);
                this.scheduleH.onNext(h);
            }
        }).subscribe();

        this.cacheNode.subscribe(this.createCacheNode);
    }

    public cache(key: string): void {
        this.createIm.onNext(key);
    }
}

export default TilesService;
