import { CellCorners, CellNeighbors } from "./interfaces/CellCorners";
import { LatLon } from "./interfaces/LatLon";

import { MapillaryError } from "../error/MapillaryError";
import { GeoCoords } from "../geo/GeoCoords";

/**
 * @class GeometryProviderBase
 *
 * @classdesc Base class to extend if implementing a geometry
 * provider class.
 *
 * @example
 * ```
 * class MyGeometryProvider extends Mapillary.API.GeometryProviderBase {
 *      ...
 * }
 * ```
 */
export abstract class GeometryProviderBase {
    protected _geoCoords: GeoCoords;
    /**
     * Create a new geometry provider base instance.
     *
     * @ignore @param {GeoCoords} [geoCoords] - Optional geo coords instance.
     */
    constructor(geoCoords?: GeoCoords) {
        this._geoCoords = geoCoords != null ? geoCoords : new GeoCoords();
    }

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
     * Get the corners of a cell.
     *
     * @param {string} cellId - Id of cell.
     * @returns {CellCorners} Cell corners struct.
     */
    public getCorners(cellId: string): CellCorners {
        throw new MapillaryError("Not implemented");
    }

    /**
     * Get the neighbors of a cell.
     *
     * @param {LatLon} sw - South west corner of the bounding box.
     * @param {LatLon} ne - North east corner of the bounding box.
     * @returns {CellCorners} Cell corners struct.
     */
    public getNeighbors(cellId: string): CellNeighbors {
        throw new MapillaryError("Not implemented");
    }

    /**
     * Convert geodetic coordinates to a cell id.
     *
     * @param {LatLon} latlon - Latitude and longitude to convert.
     * @returns {string} Cell id for the latitude, longitude.
     */
    public latLonToCellId(latLon: LatLon, relativeLevel?: number): string {
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
    public latLonToCellIds(latLon: LatLon, threshold: number, relativeLevel?: number): string[] {
        throw new MapillaryError("Not implemented");
    }

    protected _bboxSquareToCellIds(sw: LatLon, ne: LatLon): string[] {
        if (ne.lat <= sw.lat || ne.lon <= sw.lon) {
            throw new MapillaryError("North east needs to be top right of south west");
        }

        const centerLat: number = (sw.lat + ne.lat) / 2;
        const centerLon: number = (sw.lon + ne.lon) / 2;

        const enu: number[] =
            this._geoCoords.geodeticToEnu(
                ne.lat,
                ne.lon,
                0,
                centerLat,
                centerLon,
                0);

        const threshold: number = Math.max(enu[0], enu[1]);

        return this.latLonToCellIds(
            { lat: centerLat, lon: centerLon },
            threshold);
    }
}
