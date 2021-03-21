import * as geohash from "latlon-geohash";

import { GeometryProviderBase } from "./GeometryProviderBase";
import { CellCorners, CellNeighbors } from "./interfaces/CellCorners";
import { LatLon } from "./interfaces/LatLon";

import { GeoCoords } from "../geo/GeoCoords";

/**
 * @class GeohashGeometryProvider
 *
 * @classdesc Geometry provider based on geohash cells.
 *
 * @example
 * ```
 * class MyDataProvider extends Mapillary.API.DataProviderBase {
 *      ...
 * }
 *
 * const geohashGeometryProvider = new Mapillary.API.GeohashGeometryProvider();
 * const myDataProvider = new MyDataProvider(geohashGeometryProvider);
 * ```
 */
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
     * @param {LatLon} sw - South west corner of bounding box.
     * @param {LatLon} ne - North east corner of bounding box.
     *
     * @returns {string} The geohash tiles containing the bounding box.
     */
    public bboxToCellIds(sw: LatLon, ne: LatLon): string[] {
        return this._bboxSquareToCellIds(sw, ne);
    }

    /** @inheritdoc */
    public getCorners(cellId: string): CellCorners {
        const bounds: geohash.Bounds = geohash.bounds(cellId);
        const nw: LatLon = { lat: bounds.ne.lat, lon: bounds.sw.lon };
        const ne: LatLon = { lat: bounds.ne.lat, lon: bounds.ne.lon };
        const se: LatLon = { lat: bounds.ne.lat, lon: bounds.sw.lon };
        const sw: LatLon = { lat: bounds.sw.lat, lon: bounds.sw.lon };
        return { nw, ne, se, sw };
    }

    /** @inheritdoc */
    public getNeighbors(cellId: string): CellNeighbors {
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
    public latLonToCellId(
        latLon: LatLon,
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
     * @param {LatLon} latlon - Latitude and longitude to encode.
     * @param {number} precision - Precision of the encoding.
     * @param {number} threshold - Threshold of the encoding in meters.
     *
     * @returns {Array<string>} The geohash tiles reachable within the
     * threshold.
     */
    public latLonToCellIds(
        latLon: LatLon,
        threshold: number,
        relativeLevel: number = 0): string[] {

        const h: string = geohash.encode(
            latLon.lat, latLon.lon, this._level + relativeLevel);

        const bounds: geohash.Bounds = geohash.bounds(h);
        const corners: CellCorners = {
            ne: { lat: bounds.ne.lat, lon: bounds.ne.lon },
            nw: { lat: bounds.ne.lat, lon: bounds.sw.lon },
            se: { lat: bounds.sw.lat, lon: bounds.ne.lon },
            sw: { lat: bounds.sw.lat, lon: bounds.sw.lon },
        };

        const neighbours: CellNeighbors = this.getNeighbors(h);

        return this._filterNeighbors(
            latLon,
            threshold,
            h,
            corners,
            neighbours);
    }

    private _filterNeighbors(
        latLon: LatLon,
        threshold: number,
        cellId: string,
        corners: CellCorners,
        neighbors: CellNeighbors): string[] {

        const bl: number[] = [0, 0, 0];
        const tr: number[] =
            this._geoCoords.geodeticToEnu(
                corners.ne.lat,
                corners.ne.lon,
                0,
                corners.sw.lat,
                corners.sw.lon,
                0);

        const position: number[] =
            this._geoCoords.geodeticToEnu(
                latLon.lat,
                latLon.lon,
                0,
                corners.sw.lat,
                corners.sw.lon,
                0);

        const left: number = position[0] - bl[0];
        const right: number = tr[0] - position[0];
        const bottom: number = position[1] - bl[1];
        const top: number = tr[1] - position[1];

        const l: boolean = left < threshold;
        const r: boolean = right < threshold;
        const b: boolean = bottom < threshold;
        const t: boolean = top < threshold;

        const cellIds: string[] = [cellId];

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
