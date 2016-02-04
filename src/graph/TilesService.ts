/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/latlon-geohash/latlon-geohash.d.ts" />

import * as _ from "underscore";
import * as geohash from "latlon-geohash";
import * as rx from "rx";

import {IAPINavIm, APIv2} from "../API";
import {Spatial} from "../Geo";
import {Node} from "../Graph";

interface ITilesOperation extends Function {
    (tilesCache: {[key: string]: boolean}): {[key: string]: boolean};
}

export class TilesService {
    private _updates$: rx.Subject<any> = new rx.Subject<any>();

    private _cacheH$: rx.Subject<string> = new rx.Subject<string>();
    private _cacheNodeH$: rx.Subject<Node> = new rx.Subject<Node>();
    private _cacheIm$: rx.Subject<string> = new rx.Subject<string>();
    private _cacheNode$: rx.Subject<Node> = new rx.Subject<Node>();

    private _imTiles$: rx.Observable<IAPINavIm>;
    private _hTiles$: rx.Observable<IAPINavIm>;
    private _tiles$: rx.ConnectableObservable<IAPINavIm>;

    private _cachedTiles$: rx.Observable<{[key: string]: boolean}>;

    private _spatialLib: Spatial;

    private _apiV2: APIv2;

    constructor (apiV2: APIv2) {
        this._spatialLib = new Spatial();
        this._apiV2 = apiV2;

        this._cachedTiles$ = this._updates$
            .scan<{[key: string]: boolean}>(
            (tilesCache: {[key: string]: boolean}, operation: ITilesOperation): {[key: string]: boolean} => {
                return operation(tilesCache);
            },
            {})
            .shareReplay(1);

        this._imTiles$ = this._cacheIm$.distinct().flatMap<IAPINavIm>((im: string): rx.Observable<IAPINavIm> => {
            return rx.Observable.fromPromise(this._apiV2.nav.im(im));
        });

        this._hTiles$ = this._cacheH$.distinct().flatMap<IAPINavIm>((h: string): rx.Observable<IAPINavIm> => {
            return rx.Observable.fromPromise(this._apiV2.nav.h(h));
        });

        this._cacheNodeH$.distinct((node: Node) => {
            return node.key;
        }).flatMap<string>((node: Node): rx.Observable<string> => {
            return rx.Observable.from<string>(node.hs);
        }).subscribe(this._cacheH$);

        this._tiles$ = this._imTiles$.merge(this._hTiles$).publish();
        this._tiles$.connect();

        this._tiles$.map((data: IAPINavIm): ITilesOperation => {
            return (tilesCache: {[key: string]: boolean}): {[key: string]: boolean} => {
                if (data !== undefined) {
                    _.each(data.hs, (h: string) => {
                        tilesCache[h] = true;
                    });
                }

                return tilesCache;
            };
        }).subscribe(this._updates$);

        this._cacheNode$.flatMap<string>((node: Node): rx.Observable<string> => {
            let hs: string[] = [];

            let h: string = geohash.encode(node.latLon.lat, node.latLon.lon, 7);
            hs.push(h);

            _.each(geohash.neighbours(h), (nh: string): void => {
                hs.push(nh);
            });

            return rx.Observable.from<string>(hs);
        }).subscribe(this._cacheH$);
    }

    public get cacheH$(): rx.Subject<string> {
        return this._cacheH$;
    }

    public get cacheNodeH$(): rx.Subject<Node> {
        return this._cacheNodeH$;
    }

    public get cacheIm$(): rx.Subject<string> {
        return this._cacheIm$;
    }

    public get cacheNode$(): rx.Subject<Node> {
        return this._cacheNode$;
    }

    public get cachedTiles$(): rx.Observable<{[key: string]: boolean}> {
        return this._cachedTiles$;
    }

    public get tiles$(): rx.ConnectableObservable<IAPINavIm> {
        return this._tiles$;
    }

}

export default TilesService;
