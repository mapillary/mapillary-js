/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {GeoCoords} from "../../src/Geo";
import {IAPINavIm, IAPINavImIm, IAPINavImS} from "../../src/API";
import {ILatLonAlt, ILatLon} from "../../src/Graph";

export interface ITile {
    row: number;
    col: number;
    size: number;
}

export interface ITileBounds {
    sw: ILatLon;
    ne: ILatLon;
}

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

    public encode(latLon: ILatLon, size: number): string {
        let topocentric: number[] = this._geoCoords.topocentric_from_lla(
            latLon.lat,
            latLon.lon,
            0,
            this._originCoords.lat,
            this._originCoords.lon,
            this._originCoords.alt
        );

        let row: number = Math.floor(-topocentric[1] / (size * this._nodeDistance));
        let col: number = Math.floor(topocentric[0] / (size * this._nodeDistance));

        let hash: string = this.createHash({ col: col, row: row, size: size });

        return hash;
    }

    public getNeighbours(hash: string): string[] {
        let tile: ITile = this._parseHash(hash);

        let neighbours: string[] = [];

        for (let row: number = tile.row - 1; row <= tile.row + 1; row++) {
            for (let col: number = tile.col - 1; col <= tile.col + 1; col++) {
                if (row === tile.row && col === tile.col) {
                    continue;
                }

                neighbours.push(this.createHash({ row: row, col: col, size: tile.size }));
            }
        }

        return neighbours;
    }

    public getBounds(hash: string): ITileBounds {
        let tile: ITile = this._parseHash(hash);

        let leftX: number = this._leftX(tile);
        let topY: number = this._topY(tile);
        let rightX: number = this._rightX(tile);
        let bottomY: number = this._bottomY(tile);

        let bl: number[] =
            this._geoCoords.lla_from_topocentric(
                leftX,
                bottomY,
                0,
                this._originCoords.lat,
                this._originCoords.lon,
                this._originCoords.alt);

        let tr: number[] =
            this._geoCoords.lla_from_topocentric(
                rightX,
                topY,
                0,
                this._originCoords.lat,
                this._originCoords.lon,
                this._originCoords.alt);

        return { sw: { lat: bl[0], lon: bl[1] }, ne: { lat: tr[0], lon: tr[1] } };
    }

    public createHash(tile: ITile): string {
        return tile.row.toString() + ":" + tile.col.toString() + ":" + tile.size.toString();
    }

    public create(hash: string): IAPINavIm {
        let tile: ITile = this._parseHash(hash);

        let leftX: number = this._leftX(tile);
        let topY: number = this._topY(tile);

        let ims: IAPINavImIm[] = [];
        let ss: IAPINavImS[] = [];

        for (let i: number = 0; i < tile.size; i++) {
            for (let j: number = 0; j < tile.size; j++) {
                let x: number = leftX + this._nodeDistance / 2 + i * this._nodeDistance;
                let y: number = topY - this._nodeDistance / 2 - j * this._nodeDistance;

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
                    key: hash + "_" + j.toString() + ":" + i.toString(),
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

        let result: IAPINavIm = {
            hs: [hash],
            ims: ims,
            ss: ss,
        };

        return result;
    }


    private _leftX(tile: ITile): number {
        return tile.size * this._nodeDistance * tile.col;
    }

    private _rightX(tile: ITile): number {
        return tile.size * this._nodeDistance * (tile.col + 1);
    }

    private _topY(tile: ITile): number {
        return -tile.size * this._nodeDistance * tile.row;
    }

    private _bottomY(tile: ITile): number {
         return -tile.size * this._nodeDistance * (tile.row + 1);
    }

    private _parseHash(hash: string): ITile {
        let coords: number[] = hash
            .split(":")
            .map((coord: string): number => {
                return parseInt(coord);
            });

        if (coords.length !== 3) {
            throw Error("Tile format must be on the form col:row:size");
        }

        if (coords[2] < 1) {
            throw Error("Node number must be a positive integer");
        }

        let row: number = coords[0];
        let col: number = coords[1];
        let size: number = coords[2];

        return { col: col, row: row, size: size };
    }
}
