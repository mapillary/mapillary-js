/// <reference path="../../typings/index.d.ts" />

import * as _ from "underscore";
import * as geohash from "latlon-geohash";

import {ConnectableObservable} from "rxjs/observable/ConnectableObservable";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/from";
import "rxjs/add/observable/fromPromise";

import "rxjs/add/operator/distinct";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/publish";
import "rxjs/add/operator/publishReplay";

import {IAPINavIm, APIv2} from "../API";
import {Spatial} from "../Geo";
import {Node} from "../Graph";

interface ITilesOperation extends Function {
    (tilesCache: {[key: string]: boolean}): {[key: string]: boolean};
}

export class TilesService {
    private _updates$: Subject<any> = new Subject<any>();

    private _cacheH$: Subject<string> = new Subject<string>();
    private _cacheNodeH$: Subject<Node> = new Subject<Node>();
    private _cacheIm$: Subject<string> = new Subject<string>();
    private _cacheNode$: Subject<Node> = new Subject<Node>();

    private _imTiles$: Observable<IAPINavIm>;
    private _hTiles$: Observable<IAPINavIm>;
    private _tiles$: ConnectableObservable<IAPINavIm>;

    private _cachedTiles$: Observable<{[key: string]: boolean}>;

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
            .publishReplay(1)
            .refCount();

        this._imTiles$ = this._cacheIm$
            .distinct()
            .mergeMap<IAPINavIm>(
                (im: string): Observable<IAPINavIm> => {
                    return Observable.fromPromise<IAPINavIm>(this._apiV2.nav.im(im));
                });

        this._hTiles$ = this._cacheH$
            .distinct()
            .mergeMap<IAPINavIm>(
                (h: string): Observable<IAPINavIm> => {
                    return Observable.fromPromise<IAPINavIm>(this._apiV2.nav.h(h));
                });

        this._cacheNodeH$
            .distinct(
                (n1: Node, n2: Node) => {
                    return n1.key === n2.key;
                })
            .mergeMap<string>(
                (node: Node): Observable<string> => {
                    return Observable.from<string>(node.hs);
                })
            .subscribe(this._cacheH$);

        this._tiles$ = this._imTiles$
            .merge<IAPINavIm>(this._hTiles$)
            .publish();

        this._tiles$.connect();

        this._tiles$
            .map(
                (data: IAPINavIm): ITilesOperation => {
                    return (tilesCache: {[key: string]: boolean}): {[key: string]: boolean} => {
                        if (data !== undefined) {
                            _.each(data.hs, (h: string) => {
                                tilesCache[h] = true;
                            });
                        }

                        return tilesCache;
                    };
                })
            .subscribe(this._updates$);

        this._cacheNode$
            .mergeMap<string>(
                (node: Node): Observable<string> => {
                    let hs: string[] = [];

                    let h: string = geohash.encode(node.latLon.lat, node.latLon.lon, 7);
                    hs.push(h);

                    _.each(geohash.neighbours(h), (nh: string): void => {
                        hs.push(nh);
                    });

                    return Observable.from<string>(hs);
                })
            .subscribe(this._cacheH$);
    }

    public get cacheH$(): Subject<string> {
        return this._cacheH$;
    }

    public get cacheNodeH$(): Subject<Node> {
        return this._cacheNodeH$;
    }

    public get cacheIm$(): Subject<string> {
        return this._cacheIm$;
    }

    public get cacheNode$(): Subject<Node> {
        return this._cacheNode$;
    }

    public get cachedTiles$(): Observable<{[key: string]: boolean}> {
        return this._cachedTiles$;
    }

    public get tiles$(): ConnectableObservable<IAPINavIm> {
        return this._tiles$;
    }

}

export default TilesService;
