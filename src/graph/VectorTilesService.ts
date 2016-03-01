/// <reference path="../../typings/browser.d.ts" />

// import * as _ from "underscore";
// import * as geohash from "latlon-geohash";
import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";
import * as rx from "rx";

import {IGoogleTile, GoogleTiles} from "../Geo";
import {Node} from "../Graph";
import {Urls} from "../Utils";

export class VectorTilesService {
    private _googleTiles: GoogleTiles;

    private _cacheNode$: rx.Subject<Node> = new rx.Subject<Node>();

    private _model: falcor.Model;
    private _mapillaryObjects$: rx.Observable<any>;

    constructor () {
        this._model =
            new falcor.Model({
                source: new HttpDataSource(Urls.falcorModel(), {
                    crossDomain: true,
                    withCredentials: false,
                }),
            });

        this._googleTiles = new GoogleTiles();

        this._mapillaryObjects$ = this._cacheNode$.map<IGoogleTile>((node: Node): IGoogleTile => {
            return this._googleTiles.getTileAtLatLon(node.latLon, 19);
        }).distinct((tile: IGoogleTile): string => {
            return tile.z + "-" + tile.x + "-" + tile.y;
        }).flatMap((tile: IGoogleTile): any => {
            let path: string = "tile['all']";
            path += "[" + tile.z + "]";
            path += "[" + tile.x + "]";
            path += "[" + tile.y + "]";
            path += "['objects'][0..10]['key', 'value', 'package', 'l', 'alt', 'rects', 'last_seen_at', 'first_seen_at']";

            return this._model
                .get(path);
        }).flatMap((tile: any): any => {
            let z: number = parseInt(Object.keys(tile.json.tile.all)[0], 10);
            let x: number = parseInt(Object.keys(tile.json.tile.all[z])[0], 10);
            let y: number = parseInt(Object.keys(tile.json.tile.all[z][x])[0], 10);
            let objects: any = tile.json.tile.all[z][x][y].objects;

            let ret: any[] = [];

            for (let object in objects) {
                if (objects.hasOwnProperty(object)) {
                    if (object !== "$__path") {
                        object = objects[object];
                        if (object.rects.length > 1) {
                            delete object.$__path;
                            ret.push(object);
                        }
                    }
                }
            }

            return rx.Observable.from(ret);
        }).shareReplay(1);
    }

    public get cacheNode$(): rx.Subject<Node> {
        return this._cacheNode$;
    }

    public get mapillaryObjects$(): rx.Observable<any> {
        return this._mapillaryObjects$;
    }
}

export default VectorTilesService;
