/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {GeoCoords} from "../../src/Geo";
import {IAPINavIm, IAPINavImIm, IAPINavImS} from "../../src/API";
import {ILatLonAlt} from "../../src/Graph";

export class TileFactory {
    private _geoCoords: GeoCoords;

    private _nodeDistance: number;
    private _origin: number[];
    private _originCoords: ILatLonAlt;

    constructor() {
        this._geoCoords = new GeoCoords();

        this._nodeDistance = 10;
        this._origin = [0, 0, 0];
        this._originCoords = { alt: 0, lat: 0, lon: 0 };
    }

    public createHash(tileX: number, tileY: number): string {
        return tileY.toString() + ":" + tileX.toString();
    }

    public create(hash: string, nodes: number): IAPINavIm {
        let coords: number[] = hash
            .split(":")
            .map((coord: string): number => {
                return parseInt(coord);
            });

        if (coords.length !== 2) {
            throw Error("Tile format must be on the form col:row");
        }

        let tileX: number = coords[1];
        let tileY: number = coords[0];

        return this._createTile(tileX, tileY, nodes);
    }

    private _createTile(tileX: number, tileY: number, nodes: number): IAPINavIm {
        let startX: number = nodes * this._nodeDistance * tileX;
        let startY: number = nodes * this._nodeDistance * tileY;
        let endX: number = startX + nodes * this._nodeDistance;
        let endY: number = startY + nodes * this._nodeDistance;

        let ims: IAPINavImIm[] = [];
        let ss: IAPINavImS[] = [];

        for (let i: number = 0; i < nodes; i++) {
            for (let j: number = 0; j < nodes; j++) {
                let x: number = startX + this._nodeDistance / 2 + i * this._nodeDistance;
                let y: number = startY + this._nodeDistance / 2 + j * this._nodeDistance;

                let coords: number[] =
                    this._geoCoords.lla_from_topocentric(
                        x,
                        y,
                        0,
                        this._originCoords.lat,
                        this._originCoords.lon,
                        this._originCoords.alt);

                let im: IAPINavImIm = {
                    atomic_scale: 1,
                    ca: 0,
                    calt: coords[2],
                    cfocal: 1,
                    height: 1,
                    key: this.createHash(tileX, tileY) + "_" + j.toString() + ":" + i.toString(),
                    lat: coords[0],
                    lon: coords[1],
                    merge_version: 7,
                    merge_cc: Math.round(Math.random() * 1e9),
                    orientation: 1,
                    rotation: [-Math.PI / 2, 0, 0],
                    user: Math.random().toString().substring(2, 8),
                    width: 1,
                };

                ims.push(im);

                let s: IAPINavImS = {
                    key: Math.random().toString().substring(2, 8),
                    keys: [im.key],
                }

                ss.push(s);
            }
        }

        let tile: IAPINavIm = {
            hs: [this.createHash(tileX, tileY)],
            ims: ims,
            ss: ss,
        };

        return tile;
    }
}
