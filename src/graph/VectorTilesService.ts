/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/from";

import "rxjs/add/operator/distinct";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/publishReplay";


import {APIv3} from "../API";
import {ITile, WebMercator} from "../Geo";
import {MapillaryObject, MapillaryRect, Node} from "../Graph";

export class VectorTilesService {
    private _apiV3: APIv3;

    private _webMercator: WebMercator;
    private _cacheNode$: Subject<Node> = new Subject<Node>();
    private _mapillaryObjects$: Observable<any>;

    constructor (apiV3: APIv3) {
        this._apiV3 = apiV3;
        this._webMercator = new WebMercator();

        this._mapillaryObjects$ = this._cacheNode$
            .map<ITile>(
                (node: Node): ITile => {
                    return this._webMercator.getTile(node.latLon, 17);
                })
            .distinct(
                (t1: ITile, t2: ITile): boolean => {
                    return t1.x === t2.x && t1.y === t2.y && t1.z === t2.z;
                })
            .mergeMap(
                (tile: ITile): any => {
                    return this._apiV3.legacyModel.get([
                        "tile",
                        "all",
                        tile.z,
                        tile.x,
                        tile.y,
                        "objects",
                        {from: 0, to: 100},
                        ["key", "value", "package", "l", "alt", "rects", "last_seen_at", "first_seen_at"],
                    ]);
                })
            .mergeMap<MapillaryObject>(
                (tile: any): Observable<MapillaryObject> => {
                    let z: number = parseInt(Object.keys(tile.json.tile.all)[0], 10);
                    let x: number = parseInt(Object.keys(tile.json.tile.all[z])[0], 10);
                    let y: number = parseInt(Object.keys(tile.json.tile.all[z][x])[0], 10);
                    let objects: any = tile.json.tile.all[z][x][y].objects;

                    let ret: MapillaryObject[] = [];

                    for (let k in objects) {
                        if (!objects.hasOwnProperty(k)) {
                            continue;
                        }

                        let object: any = objects[k];
                        delete object.$__path;

                        if (object.rects && object.rects.length > 1) {
                            let mapillaryRects: MapillaryRect[] = [];

                            for (let l in object.rects) {
                                if (object.rects.hasOwnProperty(l)) {
                                    let rect: any = object.rects[l];

                                    let mapillaryRect: MapillaryRect =
                                        new MapillaryRect(
                                            rect.capturedAt,
                                            rect.imageKey,
                                            rect.rectKey);

                                    mapillaryRects.push(mapillaryRect);
                                }
                            }

                            let mapillaryObject: MapillaryObject =
                                new MapillaryObject(
                                    object.alt,
                                    object.first_seen_at,
                                    object.l,
                                    object.key,
                                    object.lastSeenAt,
                                    object.rects,
                                    object.dPackage,
                                    object.value);

                            ret.push(mapillaryObject);
                        }
                    }

                    return Observable.from<MapillaryObject>(ret);
                })
            .publishReplay(1)
            .refCount();
    }

    public get cacheNode$(): Subject<Node> {
        return this._cacheNode$;
    }

    public get mapillaryObjects$(): Observable<MapillaryObject> {
        return this._mapillaryObjects$;
    }
}

export default VectorTilesService;
