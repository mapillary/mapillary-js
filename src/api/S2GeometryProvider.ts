import { S2 } from "s2-geometry";

import { GeometryProviderBase } from "./GeometryProviderBase";
import { CellCorners, CellNeighbors } from "./interfaces/CellCorners";
import { LatLonEnt } from "./ents/LatLonEnt";

import { GeoCoords } from "../geo/GeoCoords";

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
     *
     * @ignore @param {GeoCoords} [geoCoords] - Optional geo coords instance.
     */
    constructor(geoCoords?: GeoCoords) {
        super(geoCoords);

        this._level = 17;
    }

    /** @inheritdoc */
    public bboxToCellIds(sw: LatLonEnt, ne: LatLonEnt): string[] {
        return this._bboxSquareToCellIds(sw, ne);
    }

    /** @inheritdoc */
    public getNeighbors(cellId: string): CellNeighbors {
        const s2key: string = S2.idToKey(cellId);
        const position: string = s2key.split('/')[1];
        const level: number = position.length;

        const [w, n, e, s]: string[] = this._getNeighbors(s2key, level);
        const [, nw, , sw]: string[] = this._getNeighbors(w, level);
        const [, ne, , se]: string[] = this._getNeighbors(e, level);

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
        const key: string = S2.idToKey(cellId);
        const cell: S2.S2Cell = S2.S2Cell.FromHilbertQuadKey(key);
        const corners: S2.ILatLng[] = cell.getCornerLatLngs();

        let south: number = Number.POSITIVE_INFINITY;
        let north: number = Number.NEGATIVE_INFINITY;
        let west: number = Number.POSITIVE_INFINITY;
        let east: number = Number.NEGATIVE_INFINITY;

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
    public latLonToCellId(latLon: LatLonEnt): string {
        return this._latLonToId(latLon, this._level);
    }

    /** @inheritdoc */
    public latLonToCellIds(latLon: LatLonEnt, threshold: number): string[] {
        const cellId: string = this._latLonToId(latLon, this._level);
        const neighbors: CellNeighbors = this.getNeighbors(cellId);
        const corners: LatLonEnt[] =
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

    private _enuToGeodetic(point: number[], reference: LatLonEnt): LatLonEnt {
        const [lat, lon]: number[] = this._geoCoords.enuToGeodetic(
            point[0],
            point[1],
            point[2],
            reference.lat,
            reference.lon,
            0);

        return { lat, lon };
    }

    private _getLatLonBoundingBoxCorners(
        latLon: LatLonEnt, threshold: number): LatLonEnt[] {
        return [
            [-threshold, threshold, 0],
            [threshold, threshold, 0],
            [threshold, -threshold, 0],
            [-threshold, -threshold, 0],
        ].map(
            (point: number[]): LatLonEnt => {
                return this._enuToGeodetic(point, latLon);
            });
    }

    private _getNeighbors(s2key: string, level: number): string[] {
        const latlng: S2.ILatLng = S2.keyToLatLng(s2key);
        const neighbors: string[] = S2.latLngToNeighborKeys(
            latlng.lat,
            latlng.lng,
            level);

        return neighbors;
    }

    private _latLonToId(latLon: LatLonEnt, level: number): string {
        const s2key: string = S2.latLngToKey(
            latLon.lat,
            latLon.lon,
            level);

        return S2.keyToId(s2key);
    }
}
