import * as THREE from "three";

import { LatLon } from "../api/interfaces/LatLon";
import { enuToGeodetic } from "../geo/GeoCoords";

/**
 * @class GraphCalculator
 *
 * @classdesc Represents a calculator for graph entities.
 */
export class GraphCalculator {
    /**
     * Get the bounding box corners for a circle with radius of a threshold
     * with center in a geodetic position.
     *
     * @param {LatLon} latlon - Latitude and longitude to encode.
     * @param {number} threshold - Threshold distance from the position in meters.
     *
     * @returns {Array<LatLon>} The south west and north east corners of the
     * bounding box.
     */
    public boundingBoxCorners(
        latLon: LatLon,
        threshold: number)
        : [LatLon, LatLon] {
        let bl = enuToGeodetic(
            -threshold,
            -threshold,
            0,
            latLon.lat,
            latLon.lon,
            0);

        let tr = enuToGeodetic(
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
    public rotationFromCompass(
        compassAngle: number,
        orientation: number): number[] {
        let x = 0;
        let y = 0;
        let z = 0;

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

        let rz = new THREE.Matrix4().makeRotationZ(z);
        let euler = new THREE.Euler(x, y, compassAngle * Math.PI / 180, "XYZ");
        let re = new THREE.Matrix4().makeRotationFromEuler(euler);

        let rotation = new THREE.Vector4()
            .setAxisAngleFromRotationMatrix(re.multiply(rz));

        return rotation.multiplyScalar(rotation.w).toArray().slice(0, 3);
    }
}
