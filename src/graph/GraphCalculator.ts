import * as THREE from "three";

import { ILatLon } from "../API";
import { GraphMapillaryError } from "../Error";
import { GeoCoords } from "../Geo";

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
