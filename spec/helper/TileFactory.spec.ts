/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {GeoCoords} from "../../src/Geo";
import {IAPINavIm, IAPINavImIm, IAPINavImS} from "../../src/API";
import {ILatLonAlt, ILatLon} from "../../src/Graph";

export interface ITile {
    x: number;
    y: number;
    nodes: number;
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

    public encode(latLon: ILatLon, nodes: number): string {
        let topocentric: number[] = this._geoCoords.topocentric_from_lla(
            latLon.lat,
            latLon.lon,
            0,
            this._originCoords.lat,
            this._originCoords.lon,
            this._originCoords.alt
        );

        let x: number = Math.floor(topocentric[0] / (nodes * this._nodeDistance));
        let y: number = Math.floor(-topocentric[1] / (nodes * this._nodeDistance));

        let hash: string = this.createHash({ x: x, y: y, nodes: nodes});

        return hash;
    }

    public getNeighbours(hash: string): string[] {
        let tile: ITile = this._parseHash(hash);

        let neighbours: string[] = [];

        for (let x: number = tile.x - 1; x <= tile.x + 1; x++) {
            for (let y: number = tile.y - 1; y <= tile.y + 1; y++) {
                if (x === tile.x && y === tile.y) {
                    continue;
                }

                neighbours.push(this.createHash({ x: x, y: y, nodes: tile.nodes }));
            }
        }

        return neighbours;
    }

    public getBounds(hash: string): ITileBounds {
        let tile: ITile = this._parseHash(hash);

        let leftX: number = tile.nodes * this._nodeDistance * tile.x;
        let topY: number = -tile.nodes * this._nodeDistance * tile.y;
        let rightX: number = leftX + tile.nodes * this._nodeDistance;
        let bottomY: number = topY - tile.nodes * this._nodeDistance;

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
        return tile.y.toString() + ":" + tile.x.toString() + ":" + tile.nodes.toString();
    }

    public create(hash: string): IAPINavIm {
        let tile: ITile = this._parseHash(hash);

        let leftX: number = tile.nodes * this._nodeDistance * tile.x;
        let topY: number = tile.nodes * this._nodeDistance * tile.y;

        let ims: IAPINavImIm[] = [];
        let ss: IAPINavImS[] = [];

        for (let i: number = 0; i < tile.nodes; i++) {
            for (let j: number = 0; j < tile.nodes; j++) {
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

    private _parseHash(hash: string): ITile {
        let coords: number[] = hash
            .split(":")
            .map((coord: string): number => {
                return parseInt(coord);
            });

        if (coords.length !== 3) {
            throw Error("Tile format must be on the form col:row:nodes");
        }

        if (coords[2] < 1) {
            throw Error("Node number must be a positive integer");
        }

        let x: number = coords[1];
        let y: number = coords[0];
        let nodes: number = coords[2];

        return { x: x, y: y, nodes: nodes };
    }
}
