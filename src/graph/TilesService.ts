/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/latlon-geohash/latlon-geohash.d.ts" />

import * as _ from "underscore";
import * as geohash from "latlon-geohash";
import * as rx from "rx";

import {IAPINavIm, APIv2} from "../API";
import {Node} from "../Graph";

interface ITilesOperation extends Function {
    (tilesCache: {[key: string]: boolean}): {[key: string]: boolean};
}

export class TilesService {
    public updates: rx.Subject<any> = new rx.Subject<any>();

    public cacheH: rx.Subject<string> = new rx.Subject<string>();
    public cacheIm: rx.Subject<string> = new rx.Subject<string>();
    public cacheNode: rx.Subject<Node> = new rx.Subject<Node>();

    public imTiles: rx.Observable<IAPINavIm>;
    public hTiles: rx.Observable<IAPINavIm>;
    public tiles: rx.Observable<IAPINavIm>;

    public cachedTiles: rx.Observable<{[key: string]: boolean}>;

    public apiV2: APIv2;

    constructor (clientId: string) {
        this.apiV2 = new APIv2(clientId);

        this.cachedTiles = this.updates
            .scan<{[key: string]: boolean}>(
            (tilesCache: {[key: string]: boolean}, operation: ITilesOperation): {[key: string]: boolean} => {
                return operation(tilesCache);
            },
            {})
            .shareReplay(1);

        this.imTiles = this.cacheIm.distinct().flatMap<IAPINavIm>((im: string): rx.Observable<IAPINavIm> => {
            return rx.Observable.fromPromise(this.apiV2.nav.im(im));
        });

        this.hTiles = this.cacheH.distinct().flatMap<IAPINavIm>((h: string): rx.Observable<IAPINavIm> => {
            return rx.Observable.fromPromise(this.apiV2.nav.h(h));
        });

        this.tiles = this.imTiles.merge(this.hTiles);

        this.tiles.map((data: IAPINavIm): ITilesOperation => {
            return (tilesCache: {[key: string]: boolean}): {[key: string]: boolean} => {
                if (data !== undefined) {
                    _.each(data.hs, (h: string) => {
                        tilesCache[h] = true;
                    });
                }

                return tilesCache;
            };
        }).subscribe(this.updates);

        this.cacheNode.flatMap<string>((node: Node): rx.Observable<string> => {
            let hs: string[] = [];

            let h: string = geohash.encode(node.latLon.lat, node.latLon.lon, 7);
            hs.push(h);

            _.each(geohash.neighbours(h), (nh: string): void => {
                hs.push(nh);
            });

            return rx.Observable.from(hs);
        }).subscribe(this.cacheH);
    }
}

export default TilesService;
