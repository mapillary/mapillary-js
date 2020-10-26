import * as geohash from "latlon-geohash";

import {
    ICellNeighbors,
    ICellCorners,
} from "./interfaces/IGeometryProvider";
import ILatLon from "./interfaces/ILatLon";
import GeoCoords from "../geo/GeoCoords";
import GeometryProviderBase from "./GeometryProviderBase";

export class GeohashGeometryProvider extends GeometryProviderBase {
    private _level: number;

    /**
     * Create a new geohash geometry provider instance.
     *
     * @ignore @param {GeoCoords} [geoCoords] - Optional geo coords instance.
     */
    constructor(geoCoords?: GeoCoords) {
        super(geoCoords);

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
     * @param {ILatLon} sw - South west corner of bounding box.
     * @param {ILatLon} ne - North east corner of bounding box.
     *
     * @returns {string} The geohash tiles containing the bounding box.
     */
    public bboxToCellIds(sw: ILatLon, ne: ILatLon): string[] {
        return this._bboxSquareToCellIds(sw, ne);
    }

    public getCorners(cellId: string): ICellCorners {
        const bounds: geohash.Bounds = geohash.bounds(cellId);
        const nw: ILatLon = { lat: bounds.ne.lat, lon: bounds.sw.lon };
        const ne: ILatLon = { lat: bounds.ne.lat, lon: bounds.ne.lon };
        const se: ILatLon = { lat: bounds.ne.lat, lon: bounds.sw.lon };
        const sw: ILatLon = { lat: bounds.sw.lat, lon: bounds.sw.lon };
        return { nw, ne, se, sw };
    }

    public getNeighbors(cellId: string): ICellNeighbors {
        return geohash.neighbours(cellId);
    }

    /**
     * Encode the geohash tile for geodetic coordinates.
     *
     * @param {ILatLon} latlon - Latitude and longitude to encode.
     * @param {number} precision - Precision of the encoding.
     *
     * @returns {string} The geohash tile for the lat, lon and precision.
     */
    public latLonToCellId(
        latLon: ILatLon,
        relativeLevel: number = 0): string {

        return geohash.encode(
            latLon.lat,
            latLon.lon,
            this._level + relativeLevel);
    }

    /**
     * Encode the geohash tiles within a threshold from a position
     * using Manhattan distance.
     *
     * @param {ILatLon} latlon - Latitude and longitude to encode.
     * @param {number} precision - Precision of the encoding.
     * @param {number} threshold - Threshold of the encoding in meters.
     *
     * @returns {string} The geohash tiles reachable within the threshold.
     */
    public latLonToCellIds(
        latLon: ILatLon,
        threshold: number,
        relativeLevel: number = 0): string[] {

        const h: string = geohash.encode(
            latLon.lat, latLon.lon, this._level + relativeLevel);

        const bounds: geohash.Bounds = geohash.bounds(h);
        const corners: ICellCorners = {
            ne: { lat: bounds.ne.lat, lon: bounds.ne.lon },
            nw: { lat: bounds.ne.lat, lon: bounds.sw.lon },
            se: { lat: bounds.sw.lat, lon: bounds.ne.lon },
            sw: { lat: bounds.sw.lat, lon: bounds.sw.lon },
        };

        const neighbours: ICellNeighbors = this.getNeighbors(h);

        return this._filterNeighbors(
            latLon,
            threshold,
            h,
            corners,
            neighbours);
    }
}

export default GeohashGeometryProvider;
