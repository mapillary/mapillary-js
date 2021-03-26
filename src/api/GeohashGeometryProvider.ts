import * as geohash from "latlon-geohash";

import { GeometryProviderBase } from "./GeometryProviderBase";
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
    /**
     * Create a new geohash geometry provider instance.
     */
    constructor(private readonly _level: number = 7) {
        super();
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
    public getAdjacent(cellId: string): string[] {
        const neighbors = geohash.neighbours(cellId);
        return [
            neighbors.e,
            neighbors.n,
            neighbors.ne,
            neighbors.nw,
            neighbors.s,
            neighbors.se,
            neighbors.sw,
            neighbors.w,
        ];
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
        const cellId = geohash.encode(
            latLon.lat, latLon.lon, this._level);

        const corners =
            this._getLatLonBoundingBoxCorners(latLon, threshold);
        for (let c of corners) {
            if (geohash.encode(c.lat, c.lon, this._level) !== cellId) {
                return [cellId, ...this.getAdjacent(cellId)];
            }
        }
        return [cellId];
    }
}
