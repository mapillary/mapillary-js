import * as geohash from "latlon-geohash";

import IGeometryProvider from "./IGeometryProvider";
import ILatLon from "./interfaces/ILatLon";
import GeoCoords from "../geo/GeoCoords";
import MapillaryError from "../error/MapillaryError";

export class GeohashGeometryProvider implements IGeometryProvider {
    private _geoCoords: GeoCoords;

    /**
     * Create a new geohash geometry provider instance.
     *
     * @param {GeoCoords} [geoCoords] - Optinoal geo coords instance.
     */
    constructor(geoCoords?: GeoCoords) {
        this._geoCoords = geoCoords != null ? geoCoords : new GeoCoords();
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
     * @param {number} precision - Precision of the encoding.
     *
     * @returns {string} The geohash tiles containing the bounding box.
     */
    public bboxToCellIds(sw: ILatLon, ne: ILatLon): string[] {
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

    /**
     * Encode the geohash tile for geodetic coordinates.
     *
     * @param {ILatLon} latlon - Latitude and longitude to encode.
     * @param {number} precision - Precision of the encoding.
     *
     * @returns {string} The geohash tile for the lat, lon and precision.
     */
    public latLonToCellId(latLon: ILatLon): string {
        return geohash.encode(latLon.lat, latLon.lon, 7);
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
    public latLonToCellIds(latLon: ILatLon, threshold: number): string[] {
        const h: string = geohash.encode(latLon.lat, latLon.lon, 7);
        const bounds: geohash.Bounds = geohash.bounds(h);
        const ne: geohash.Point = bounds.ne;
        const sw: geohash.Point = bounds.sw;
        const neighbours: geohash.Neighbours = geohash.neighbours(h);

        const bl: number[] = [0, 0, 0];
        const tr: number[] =
            this._geoCoords.geodeticToEnu(
                ne.lat,
                ne.lon,
                0,
                sw.lat,
                sw.lon,
                0);

        const position: number[] =
            this._geoCoords.geodeticToEnu(
                latLon.lat,
                latLon.lon,
                0,
                sw.lat,
                sw.lon,
                0);

        const left: number = position[0] - bl[0];
        const right: number = tr[0] - position[0];
        const bottom: number = position[1] - bl[1];
        const top: number = tr[1] - position[1];

        const l: boolean = left < threshold;
        const r: boolean = right < threshold;
        const b: boolean = bottom < threshold;
        const t: boolean = top < threshold;

        const hs: string[] = [h];

        if (t) {
            hs.push(neighbours.n);
        }

        if (t && l) {
            hs.push(neighbours.nw);
        }

        if (l) {
            hs.push(neighbours.w);
        }

        if (l && b) {
            hs.push(neighbours.sw);
        }

        if (b) {
            hs.push(neighbours.s);
        }

        if (b && r) {
            hs.push(neighbours.se);
        }

        if (r) {
            hs.push(neighbours.e);
        }

        if (r && t) {
            hs.push(neighbours.ne);
        }

        return hs;
    }
}

export default GeohashGeometryProvider;
