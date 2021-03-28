import { MapillaryError } from "../error/MapillaryError";
import {
    enuToGeodetic,
    geodeticToEnu,
} from "../geo/GeoCoords";
import { LngLat } from "./interfaces/LngLat";

/**
 * @class GeometryProviderBase
 *
 * @classdesc Base class to extend if implementing a geometry
 * provider class.
 *
 * @example
 * ```js
 * class MyGeometryProvider extends mapillary.API.GeometryProviderBase {
 *      ...
 * }
 * ```
 */
export abstract class GeometryProviderBase {
    /**
     * Create a new geometry provider base instance.
     */
    constructor() { /** noop */ }

    /**
     * Convert a geodetic bounding box to the the minimum set
     * of cell ids containing the bounding box.
     *
     * @description The bounding box needs
     * to be sufficiently small to be contained in an area with the size
     * of maximally four tiles. Up to nine adjacent tiles may be returned.
     *
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     *
     * @returns {Array<string>} Array of cell ids.
     */
    public bboxToCellIds(sw: LngLat, ne: LngLat): string[] {
        throw new MapillaryError("Not implemented");
    }

    /**
     * Get the adjacent cells
     *
     * @param {string} cellId - Id of cell.
     * @returns {Array<string>} Array of cell ids. No specific
     * order is guaranteed.
     */
    public getAdjacent(cellId: string): string[] {
        throw new MapillaryError("Not implemented");
    }

    /**
     * Get the vertices of a cell.
     *
     * @description The vertices form an unclosed
     * clockwise polygon in the 2D latitude, longitude
     * space. No assumption on the position of the first
     * vertex relative to the others can be made.
     *
     * @param {string} cellId - Id of cell.
     * @returns {Array<LngLat>} Unclosed clockwise polygon.
     */
    public getVertices(cellId: string): LngLat[] {
        throw new MapillaryError("Not implemented");
    }

    /**
     * Convert geodetic coordinates to a cell id.
     *
     * @param {LngLat} lngLat - Latitude and longitude to convert.
     * @returns {string} Cell id for the latitude, longitude.
     */
    public lngLatToCellId(lngLat: LngLat): string {
        throw new MapillaryError("Not implemented");
    }

    /** @ignore */
    protected _approxBboxToCellIds(sw: LngLat, ne: LngLat): string[] {
        if (ne.lat <= sw.lat || ne.lng <= sw.lng) {
            throw new MapillaryError(
                "North east needs to be top right of south west");
        }

        const centerLat = (sw.lat + ne.lat) / 2;
        const centerLon = (sw.lng + ne.lng) / 2;

        const enu =
            geodeticToEnu(
                ne.lat,
                ne.lng,
                0,
                centerLat,
                centerLon,
                0);

        const threshold = Math.max(enu[0], enu[1]);

        return this._lngLatToCellIds(
            { lat: centerLat, lng: centerLon },
            threshold);
    }

    /** @ignore */
    private _enuToGeodetic(point: number[], reference: LngLat): LngLat {
        const [lat, lon] = enuToGeodetic(
            point[0],
            point[1],
            point[2],
            reference.lat,
            reference.lng,
            0);

        return { lat, lng: lon };
    }

    /** @ignore */
    private _getLngLatBoundingBoxCorners(
        lngLat: LngLat,
        threshold: number)
        : LngLat[] {

        return [
            [-threshold, threshold, 0],
            [threshold, threshold, 0],
            [threshold, -threshold, 0],
            [-threshold, -threshold, 0],
        ].map(
            (point: number[]): LngLat => {
                return this._enuToGeodetic(point, lngLat);
            });
    }


    /**
     * Convert a geodetic square to cell ids.
     *
     * The square is specified as a latitude, longitude
     * and a threshold from the position using Manhattan distance.
     *
     * @param {LngLat} lngLat - Latitude and longitude.
     * @param {number} threshold - Threshold of the conversion in meters.
     *
     * @returns {Array<string>} Array of cell ids reachable within
     * the threshold.
     *
     * @ignore
     */
    private _lngLatToCellIds(
        lngLat: LngLat,
        threshold: number)
        : string[] {
        const cellId = this.lngLatToCellId(lngLat);
        const bboxCorners =
            this._getLngLatBoundingBoxCorners(lngLat, threshold);
        for (const corner of bboxCorners) {
            const cid = this.lngLatToCellId(corner);
            if (cid !== cellId) {
                return [cellId, ...this.getAdjacent(cellId)];
            }
        }
        return [cellId];
    }
}
