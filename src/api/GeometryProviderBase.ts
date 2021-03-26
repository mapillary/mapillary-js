import { LatLon } from "./interfaces/LatLon";

import { MapillaryError } from "../error/MapillaryError";
import {
    enuToGeodetic,
    geodeticToEnu,
} from "../geo/GeoCoords";

/**
 * @class GeometryProviderBase
 *
 * @classdesc Base class to extend if implementing a geometry
 * provider class.
 *
 * @example
 * ```
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
     * @param {LatLon} sw - South west corner of bounding box.
     * @param {LatLon} ne - North east corner of bounding box.
     *
     * @returns {Array<string>} Array of cell ids.
     */
    public bboxToCellIds(sw: LatLon, ne: LatLon): string[] {
        throw new MapillaryError("Not implemented");
    }

    /**
     * Get the adjacent cells
     *
     * @param {LatLon} sw - South west corner of the bounding box.
     * @param {LatLon} ne - North east corner of the bounding box.
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
     * @returns {Array<LatLon>} Unclosed clockwise polygon.
     */
    public getVertices(cellId: string): LatLon[] {
        throw new MapillaryError("Not implemented");
    }

    /**
     * Convert geodetic coordinates to a cell id.
     *
     * @param {LatLon} latlon - Latitude and longitude to convert.
     * @returns {string} Cell id for the latitude, longitude.
     */
    public latLonToCellId(latLon: LatLon): string {
        throw new MapillaryError("Not implemented");
    }

    /**
     * Convert a geodetic square to cell ids.
     *
     * The square is specified as a latitude, longitude
     * and a threshold from the position using Manhattan distance.
     *
     * @param {LatLon} latlon - Latitude and longitude.
     * @param {number} threshold - Threshold of the conversion in meters.
     *
     * @returns {Array<string>} Array of cell ids reachable within
     * the threshold.
     */
    public latLonToCellIds(
        latLon: LatLon,
        threshold: number)
        : string[] {
        throw new MapillaryError("Not implemented");
    }

    /** @ignore */
    protected _bboxSquareToCellIds(sw: LatLon, ne: LatLon): string[] {
        if (ne.lat <= sw.lat || ne.lon <= sw.lon) {
            throw new MapillaryError(
                "North east needs to be top right of south west");
        }

        const centerLat = (sw.lat + ne.lat) / 2;
        const centerLon = (sw.lon + ne.lon) / 2;

        const enu =
            geodeticToEnu(
                ne.lat,
                ne.lon,
                0,
                centerLat,
                centerLon,
                0);

        const threshold = Math.max(enu[0], enu[1]);

        return this.latLonToCellIds(
            { lat: centerLat, lon: centerLon },
            threshold);
    }

    /** @ignore */
    protected _enuToGeodetic(point: number[], reference: LatLon): LatLon {
        const [lat, lon] = enuToGeodetic(
            point[0],
            point[1],
            point[2],
            reference.lat,
            reference.lon,
            0);

        return { lat, lon };
    }

    /** @ignore */
    protected _getLatLonBoundingBoxCorners(
        latLon: LatLon,
        threshold: number)
        : LatLon[] {

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
}
