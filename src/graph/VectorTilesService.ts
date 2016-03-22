/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {APIv3} from "../API";
import {ITile, WebMercator} from "../Geo";
import {MapillaryObject, MapillaryRect, Node} from "../Graph";

export class VectorTilesService {
    private _apiV3: APIv3;

    private _webMercator: WebMercator;
    private _cacheNode$: rx.Subject<Node> = new rx.Subject<Node>();
    private _mapillaryObjects$: rx.Observable<any>;

    constructor (apiV3: APIv3) {
        this._apiV3 = apiV3;
        this._webMercator = new WebMercator();

        this._mapillaryObjects$ = this._cacheNode$.map<ITile>((node: Node): ITile => {
            return this._webMercator.getTile(node.latLon, 17);
        }).distinct((tile: ITile): string => {
            return tile.z + "-" + tile.x + "-" + tile.y;
        }).flatMap((tile: ITile): any => {
            return this._apiV3.model.get([
                "tile",
                "all",
                tile.z,
                tile.x,
                tile.y,
                "objects",
                {from: 0, to: 100},
                ["key", "value", "package", "l", "alt", "rects", "last_seen_at", "first_seen_at"],
            ]);
        }).flatMap<MapillaryObject>((tile: any): rx.Observable<MapillaryObject> => {
            let z: number = parseInt(Object.keys(tile.json.tile.all)[0], 10);
            let x: number = parseInt(Object.keys(tile.json.tile.all[z])[0], 10);
            let y: number = parseInt(Object.keys(tile.json.tile.all[z][x])[0], 10);
            let objects: any = tile.json.tile.all[z][x][y].objects;

            let ret: MapillaryObject[] = [];

            for (let object in objects) {
                if (!objects.hasOwnProperty(object)) {
                    continue;
                }

                delete object.$__path;
                object = objects[object];

                if (object.rects && object.rects.length > 1) {
                    let mapillaryRects: MapillaryRect[] = [];

                    for (let rect in object.rects) {
                        if (object.rects.hasOwnProperty(rect)) {
                            rect = object.rects[rect];

                            let mapillaryRect: MapillaryRect = new MapillaryRect(rect.capturedAt,
                                                                                 rect.imageKey,
                                                                                 rect.rectKey);

                            mapillaryRects.push(mapillaryRect);
                        }
                    }

                    let mapillaryObject: MapillaryObject = new MapillaryObject(object.alt,
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

            return rx.Observable.from(ret);
        }).shareReplay(1);
    }

    public get cacheNode$(): rx.Subject<Node> {
        return this._cacheNode$;
    }

    public get mapillaryObjects$(): rx.Observable<MapillaryObject> {
        return this._mapillaryObjects$;
    }
}

export default VectorTilesService;
