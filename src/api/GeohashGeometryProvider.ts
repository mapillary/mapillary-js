import * as geohash from "latlon-geohash";
import { geodeticToEnu } from "../geo/GeoCoords";

import { GeometryProviderBase } from "./GeometryProviderBase";
import { CellNeighbors } from "./interfaces/CellCorners";
import { LatLon } from "./interfaces/LatLon";


/**
 * @class GeohashGeometryProvider
 *
 * @classdesc Geometry provider based on geohash cells.
 *
 * @example
 * ```
 * class MyDataProvider extends mapillary.API.DataProviderBase {
 *      ...
 * }
 *
 * const geohashGeometryProvider = new mapillary.API.GeohashGeometryProvider();
 * const myDataProvider = new MyDataProvider(geohashGeometryProvider);
 * ```
 */
export class GeohashGeometryProvider extends GeometryProviderBase {
    private _level: number;

    /**
     * Create a new geohash geometry provider instance.
     */
    constructor() {
        super();
        this._level = 7;
    }

    /**
     * Encode the minimum set of geohash tiles containing a bounding box.
     *
     * @description The current algorithm does expect the bounding box
     * to be sufficiently small to be contained in an area with the size
     * of maximally four tiles. Up to nine adjacent tiles may be returned.
     * The method currently uses the largest side as the threshold leading to
     * more tiles being returned than needed in edge cases.
     *
     * @param {LatLon} sw - South west corner of bounding box.
     * @param {LatLon} ne - North east corner of bounding box.
     *
     * @returns {string} The geohash tiles containing the bounding box.
     */
    public bboxToCellIds(sw: LatLon, ne: LatLon): string[] {
        return this._bboxSquareToCellIds(sw, ne);
    }

    /** @inheritdoc */
    public getVertices(cellId: string): LatLon[] {
        const bounds = geohash.bounds(cellId);
        const nw = { lat: bounds.ne.lat, lon: bounds.sw.lon };
        const ne = { lat: bounds.ne.lat, lon: bounds.ne.lon };
        const se = { lat: bounds.sw.lat, lon: bounds.ne.lon };
        const sw = { lat: bounds.sw.lat, lon: bounds.sw.lon };
        return [nw, ne, se, sw];
    }

    /** @inheritdoc */
    public getAdjacent(cellId: string): CellNeighbors {
        return geohash.neighbours(cellId);
    }

    /**
     * Encode the geohash tile for geodetic coordinates.
     *
     * @param {LatLon} latlon - Latitude and longitude to encode.
     * @param {number} precision - Precision of the encoding.
     *
     * @returns {string} The geohash tile for the lat, lon and precision.
     */
    public latLonToCellId(latLon: LatLon): string {
        return geohash.encode(
            latLon.lat,
            latLon.lon,
            this._level);
    }

    /**
     * Encode the geohash tiles within a threshold from a position
     * using Manhattan distance.
     *
     * @param {LatLon} latlon - Latitude and longitude to encode.
     * @param {number} precision - Precision of the encoding.
     * @param {number} threshold - Threshold of the encoding in meters.
     *
     * @returns {Array<string>} The geohash tiles reachable within the
     * threshold.
     */
    public latLonToCellIds(
        latLon: LatLon,
        threshold: number)
        : string[] {

        const h = geohash.encode(
            latLon.lat, latLon.lon, this._level);

        const bounds = geohash.bounds(h);
        const neighbours = this.getAdjacent(h);

        return this._filterNeighbors(
            latLon,
            threshold,
            h,
            bounds,
            neighbours);
    }

    private _filterNeighbors(
        latLon: LatLon,
        threshold: number,
        cellId: string,
        bounds: geohash.Bounds,
        neighbors: CellNeighbors): string[] {

        const bl = [0, 0, 0];
        const tr =
            geodeticToEnu(
                bounds.ne.lat,
                bounds.ne.lon,
                0,
                bounds.sw.lat,
                bounds.sw.lon,
                0);

        const position =
            geodeticToEnu(
                latLon.lat,
                latLon.lon,
                0,
                bounds.sw.lat,
                bounds.sw.lon,
                0);

        const left = position[0] - bl[0];
        const right = tr[0] - position[0];
        const bottom = position[1] - bl[1];
        const top = tr[1] - position[1];

        const l = left < threshold;
        const r = right < threshold;
        const b = bottom < threshold;
        const t = top < threshold;

        const cellIds = [cellId];

        if (t) {
            cellIds.push(neighbors.n);
        }

        if (t && l) {
            cellIds.push(neighbors.nw);
        }

        if (l) {
            cellIds.push(neighbors.w);
        }

        if (l && b) {
            cellIds.push(neighbors.sw);
        }

        if (b) {
            cellIds.push(neighbors.s);
        }

        if (b && r) {
            cellIds.push(neighbors.se);
        }

        if (r) {
            cellIds.push(neighbors.e);
        }

        if (r && t) {
            cellIds.push(neighbors.ne);
        }

        return cellIds;
    }
}
