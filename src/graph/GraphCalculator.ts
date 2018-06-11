import * as geohash from "latlon-geohash";
import * as THREE from "three";

import {ILatLon} from "../API";
import {GraphMapillaryError} from "../Error";
import {GeoCoords} from "../Geo";

/**
 * @class GraphCalculator
 *
 * @classdesc Represents a calculator for graph entities.
 */
export class GraphCalculator {
    private _geoCoords: GeoCoords;

    /**
     * Create a new graph calculator instance.
     *
     * @param {GeoCoords} geoCoords - Geo coords instance.
     */
    constructor(geoCoords?: GeoCoords) {
        this._geoCoords = geoCoords != null ? geoCoords : new GeoCoords();
    }

    /**
     * Encode the geohash tile for geodetic coordinates.
     *
     * @param {ILatLon} latlon - Latitude and longitude to encode.
     * @param {number} precision - Precision of the encoding.
     *
     * @returns {string} The geohash tile for the lat, lon and precision.
     */
    public encodeH(latLon: ILatLon, precision: number = 7): string {
        return geohash.encode(latLon.lat, latLon.lon, precision);
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
    public encodeHs(latLon: ILatLon, precision: number = 7, threshold: number = 20): string[] {
        let h: string = geohash.encode(latLon.lat, latLon.lon, precision);
        let bounds: geohash.Bounds = geohash.bounds(h);
        let ne: geohash.Point = bounds.ne;
        let sw: geohash.Point = bounds.sw;
        let neighbours: geohash.Neighbours = geohash.neighbours(h);

        let bl: number[] = [0, 0, 0];
        let tr: number[] =
            this._geoCoords.geodeticToEnu(
                ne.lat,
                ne.lon,
                0,
                sw.lat,
                sw.lon,
                0);

        let position: number[] =
            this._geoCoords.geodeticToEnu(
                latLon.lat,
                latLon.lon,
                0,
                sw.lat,
                sw.lon,
                0);

        let left: number = position[0] - bl[0];
        let right: number = tr[0] - position[0];
        let bottom: number = position[1] - bl[1];
        let top: number = tr[1] - position[1];

        let l: boolean = left < threshold;
        let r: boolean = right < threshold;
        let b: boolean = bottom < threshold;
        let t: boolean = top < threshold;

        let hs: string[] = [h];

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
    public encodeHsFromBoundingBox(sw: ILatLon, ne: ILatLon, precision: number = 7): string[] {
        if (ne.lat <= sw.lat || ne.lon <= sw.lon) {
            throw new GraphMapillaryError("North east needs to be top right of south west");
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

        return this.encodeHs({ lat: centerLat, lon: centerLon }, precision, threshold);
    }

    /**
     * Get the bounding box corners for a circle with radius of a threshold
     * with center in a geodetic position.
     *
     * @param {ILatLon} latlon - Latitude and longitude to encode.
     * @param {number} threshold - Threshold distance from the position in meters.
     *
     * @returns {Array<ILatLon>} The south west and north east corners of the
     * bounding box.
     */
    public boundingBoxCorners(latLon: ILatLon, threshold: number): [ILatLon, ILatLon] {
        let bl: number[] =
            this._geoCoords.enuToGeodetic(
                -threshold,
                -threshold,
                0,
                latLon.lat,
                latLon.lon,
                0);

        let tr: number[] =
            this._geoCoords.enuToGeodetic(
                threshold,
                threshold,
                0,
                latLon.lat,
                latLon.lon,
                0);

        return [
            { lat: bl[0], lon: bl[1] },
            { lat: tr[0], lon: tr[1] },
        ];
    }

    /**
     * Convert a compass angle to an angle axis rotation vector.
     *
     * @param {number} compassAngle - The compass angle in degrees.
     * @param {number} orientation - The orientation of the original image.
     *
     * @returns {Array<number>} Angle axis rotation vector.
     */
    public rotationFromCompass(compassAngle: number, orientation: number): number[] {
        let x: number = 0;
        let y: number = 0;
        let z: number = 0;

        switch (orientation) {
            case 1:
                x = Math.PI / 2;
                break;
            case 3:
                x = -Math.PI / 2;
                z = Math.PI;
                break;
            case 6:
                y = -Math.PI / 2;
                z = -Math.PI / 2;
                break;
            case 8:
                y = Math.PI / 2;
                z = Math.PI / 2;
                break;
            default:
                break;
        }

        let rz: THREE.Matrix4 = new THREE.Matrix4().makeRotationZ(z);
        let euler: THREE.Euler = new THREE.Euler(x, y, compassAngle * Math.PI / 180, "XYZ");
        let re: THREE.Matrix4 = new THREE.Matrix4().makeRotationFromEuler(euler);

        let rotation: THREE.Vector4 = new THREE.Vector4().setAxisAngleFromRotationMatrix(<any>re.multiply(rz));

        return rotation.multiplyScalar(rotation.w).toArray().slice(0, 3);
    }
}

export default GraphCalculator;
