import * as geohash from "latlon-geohash";

import { GeometryProviderBase } from "./GeometryProviderBase";
import { LngLat } from "./interfaces/LngLat";


/**
 * @class GeohashGeometryProvider
 *
 * @classdesc Geometry provider based on geohash cells.
 *
 * @example
 * ```
 * class MyDataProvider extends DataProviderBase {
 *      ...
 * }
 *
 * const geometryProvider = new GeohashGeometryProvider();
 * const dataProvider = new MyDataProvider(geohashGeometryProvider);
 * ```
 */
export class GeohashGeometryProvider extends GeometryProviderBase {
    /**
     * Create a new geohash geometry provider instance.
     */
    constructor(private readonly _level: number = 7) { super(); }

    /**
     * Encode the minimum set of geohash tiles containing a bounding box.
     *
     * @description The current algorithm does expect the bounding box
     * to be sufficiently small to be contained in an area with the size
     * of maximally four tiles. Up to nine adjacent tiles may be returned.
     * The method currently uses the largest side as the threshold leading to
     * more tiles being returned than needed in edge cases.
     *
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     *
     * @returns {string} The geohash tiles containing the bounding box.
     */
    public bboxToCellIds(sw: LngLat, ne: LngLat): string[] {
        return this._approxBboxToCellIds(sw, ne);
    }

    /** @inheritdoc */
    public getVertices(cellId: string): LngLat[] {
        const bounds = geohash.bounds(cellId);
        const nw: LngLat = { lat: bounds.ne.lat, lng: bounds.sw.lon };
        const ne: LngLat = { lat: bounds.ne.lat, lng: bounds.ne.lon };
        const se: LngLat = { lat: bounds.sw.lat, lng: bounds.ne.lon };
        const sw: LngLat = { lat: bounds.sw.lat, lng: bounds.sw.lon };
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
     * @param {LngLat} lngLat - Longitude, latitude to encode.
     * @param {number} precision - Precision of the encoding.
     *
     * @returns {string} The geohash tile for the lat, lon and precision.
     */
    public lngLatToCellId(lngLat: LngLat): string {
        return geohash.encode(
            lngLat.lat,
            lngLat.lng,
            this._level);
    }
}
