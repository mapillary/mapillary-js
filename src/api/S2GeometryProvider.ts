import { S2 } from "s2-geometry";
import { enuToGeodetic } from "../geo/GeoCoords";

import { GeometryProviderBase } from "./GeometryProviderBase";
import { CellCorners, CellNeighbors } from "./interfaces/CellCorners";
import { LatLon } from "./interfaces/LatLon";


/**
 * @class S2GeometryProvider
 *
 * @classdesc Geometry provider based on S2 cells.
 *
 * @example
 * ```
 * class MyDataProvider extends Mapillary.API.DataProviderBase {
 *      ...
 * }
 *
 * const s2GeometryProvider = new Mapillary.API.S2GeometryProvider();
 * const myDataProvider = new MyDataProvider(s2GeometryProvider);
 * ```
 */
export class S2GeometryProvider extends GeometryProviderBase {
    private _level: number;

    /**
     * Create a new S2 geometry provider instance.
     */
    constructor() {
        super();
        this._level = 17;
    }

    /** @inheritdoc */
    public bboxToCellIds(sw: LatLon, ne: LatLon): string[] {
        return this._bboxSquareToCellIds(sw, ne);
    }

    /** @inheritdoc */
    public getNeighbors(cellId: string): CellNeighbors {
        const s2key = S2.idToKey(cellId);
        const position = s2key.split('/')[1];
        const level = position.length;

        const [w, n, e, s] = this._getNeighbors(s2key, level);
        const [, nw, , sw] = this._getNeighbors(w, level);
        const [, ne, , se] = this._getNeighbors(e, level);

        return {
            e: S2.keyToId(e),
            n: S2.keyToId(n),
            ne: S2.keyToId(ne),
            nw: S2.keyToId(nw),
            s: S2.keyToId(s),
            se: S2.keyToId(se),
            sw: S2.keyToId(sw),
            w: S2.keyToId(w),
        };
    }

    /** @inheritdoc */
    public getCorners(cellId: string): CellCorners {
        const key = S2.idToKey(cellId);
        const cell = S2.S2Cell.FromHilbertQuadKey(key);
        const corners = cell.getCornerLatLngs();

        let south = Number.POSITIVE_INFINITY;
        let north = Number.NEGATIVE_INFINITY;
        let west = Number.POSITIVE_INFINITY;
        let east = Number.NEGATIVE_INFINITY;

        for (let c of corners) {
            if (c.lat < south) { south = c.lat; }
            if (c.lat > north) { north = c.lat; }
            if (c.lng < west) { west = c.lng; }
            if (c.lng > east) { east = c.lng; }
        }

        return {
            ne: { lat: north, lon: east },
            nw: { lat: north, lon: west },
            se: { lat: south, lon: east },
            sw: { lat: south, lon: west },
        };
    }

    /** @inheritdoc */
    public latLonToCellId(latLon: LatLon): string {
        return this._latLonToId(latLon, this._level);
    }

    /** @inheritdoc */
    public latLonToCellIds(latLon: LatLon, threshold: number): string[] {
        const cellId = this._latLonToId(latLon, this._level);
        const neighbors = this.getNeighbors(cellId);
        const corners =
            this._getLatLonBoundingBoxCorners(latLon, threshold);

        for (let corner of corners) {
            if (this._latLonToId(corner, this._level) !== cellId) {
                return [
                    cellId,
                    neighbors.e,
                    neighbors.n,
                    neighbors.ne,
                    neighbors.nw,
                    neighbors.s,
                    neighbors.se,
                    neighbors.sw,
                    neighbors.w
                ];
            }
        }

        return [cellId];
    }

    private _enuToGeodetic(point: number[], reference: LatLon): LatLon {
        const [lat, lon] = enuToGeodetic(
            point[0],
            point[1],
            point[2],
            reference.lat,
            reference.lon,
            0);

        return { lat, lon };
    }

    private _getLatLonBoundingBoxCorners(
        latLon: LatLon, threshold: number): LatLon[] {
        return [
            [-threshold, threshold, 0],
            [threshold, threshold, 0],
            [threshold, -threshold, 0],
            [-threshold, -threshold, 0],
        ].map(
            (point: number[]): LatLon => {
                return this._enuToGeodetic(point, latLon);
            });
    }

    private _getNeighbors(s2key: string, level: number): string[] {
        const latlng = S2.keyToLatLng(s2key);
        const neighbors = S2.latLngToNeighborKeys(
            latlng.lat,
            latlng.lng,
            level);

        return neighbors;
    }

    private _latLonToId(latLon: LatLon, level: number): string {
        const s2key = S2.latLngToKey(
            latLon.lat,
            latLon.lon,
            level);

        return S2.keyToId(s2key);
    }
}
