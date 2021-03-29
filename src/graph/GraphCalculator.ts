import * as THREE from "three";

import { LngLat } from "../api/interfaces/LngLat";
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
     * @param {LngLat} lngLat - Longitude, latitude to encode.
     * @param {number} threshold - Threshold distance from the position in meters.
     *
     * @returns {Array<LngLat>} The south west and north east corners of the
     * bounding box.
     */
    public boundingBoxCorners(
        lngLat: LngLat,
        threshold: number)
        : [LngLat, LngLat] {

        const sw = enuToGeodetic(
            -threshold,
            -threshold,
            0,
            lngLat.lng,
            lngLat.lat,
            0);

        const ne = enuToGeodetic(
            threshold,
            threshold,
            0,
            lngLat.lng,
            lngLat.lat,
            0);

        return [
            { lat: sw[1], lng: sw[0] },
            { lat: ne[1], lng: ne[0] },
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
        orientation: number)
        : number[] {

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

        const rz = new THREE.Matrix4()
            .makeRotationZ(z);
        const euler = new THREE.Euler(
            x,
            y,
            compassAngle * Math.PI / 180,
            "XYZ");
        const re = new THREE.Matrix4()
            .makeRotationFromEuler(euler);

        const rotation = new THREE.Vector4()
            .setAxisAngleFromRotationMatrix(
                re.multiply(rz));

        return rotation
            .multiplyScalar(rotation.w)
            .toArray()
            .slice(0, 3);
    }
}
