/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

export class Spatial {

    /**
     * @class Spatial
     */

    private epsilon: number = 1e-9;

    /**
     * Converts degrees to radians
     *
     * @param {number} deg Degrees
     */
    public degToRad(deg: number): number {
        return Math.PI * deg / 180;
    }

    /**
     * Converts radians to degrees
     *
     * @param {number} rad Radians
     */
    public radToDeg(rad: number): number {
        return 180 * rad / Math.PI;
    }

    /**
     * Creates a rotation matrix from an angle-axis vector
     *
     * @param {Array<number>} angleAxis Angle-axis representation of a rotation
     */
    public rotationMatrix(angleAxis: number[]): THREE.Matrix4 {
        let axis: THREE.Vector3 =
            new THREE.Vector3(angleAxis[0], angleAxis[1], angleAxis[2]);
        let angle: number = axis.length();

        axis.normalize();

        return new THREE.Matrix4().makeRotationAxis(axis, angle);
    }

    /**
     * Rotates a vector according to a angle-axis rotation vector
     *
     * @param {Array<number>} vector Vector to rotate
     * @param {Array<number>} angleAxis Angle-axis representation of a rotation
     */
    public rotate(vector: number[], angleAxis: number[]): THREE.Vector3 {
        let v: THREE.Vector3 = new THREE.Vector3(vector[0], vector[1], vector[2]);
        let rotationMatrix: THREE.Matrix4 = this.rotationMatrix(angleAxis);
        v.applyMatrix4(rotationMatrix);

        return v;
    }

    /**
     * Calculates the optical center from a rotation vector
     * on the angle-axis representation and a translation vector
     * according to C = -R^T t
     *
     * @param {Array<number>} rotation Angle-axis representation of a rotation
     * @param {Array<number>} translation Translation vector
     */
    public opticalCenter(rotation: number[], translation: number[]): THREE.Vector3 {
        let angleAxis: number[] = [-rotation[0], -rotation[1], -rotation[2]];
        let vector: number[] = [-translation[0], -translation[1], -translation[2]];

        return this.rotate(vector, angleAxis);
    }

    /**
     * Calculates the viewing direction from a rotation vector
     * on the angle-axis representation
     *
     * @param {number[]} rotation Angle-axis representation of a rotation
     */
    public viewingDirection(rotation: number[]): THREE.Vector3 {
        let angleAxis: number[] = [-rotation[0], -rotation[1], -rotation[2]];

        return this.rotate([0, 0, 1], angleAxis);
    }

    /**
     * Wrap a number on the interval [min, max]
     *
     * @param {number} value Value to wrap
     * @param {number} min Lower endpoint of interval
     * @param {number} max Upper endpoint of interval
     */
    public wrap(value: number, min: number, max: number): number {
        if (max < min) {
            throw new Error("Invalid arguments: max must be larger than min.");
        }

        let interval: number = (max - min);

        while (value > max || value < min) {
            if (value > max) {
                value = value - interval;
            } else if (value < min) {
                value = value + interval;
            }
        }

        return value;
    }

    /**
     * Wrap an angle on the interval [-Pi, Pi]
     *
     * @param {number} angle Value to wrap
     */
    public wrapAngle(angle: number): number {
        return this.wrap(angle, -Math.PI, Math.PI);
    }

    /**
     * Calculates the counter-clockwise angle from the first
     * vector (x1, y1)^T to the second (x2, y2)^T
     *
     * @param {number} x1 X-value of first vector
     * @param {number} y1 Y-value of first vector
     * @param {number} x2 X-value of second vector
     * @param {number} y2 Y-value of second vector
     */
    public angleBetweenVector2(x1: number, y1: number, x2: number, y2: number): number {
        let angle: number = Math.atan2(y2, x2) - Math.atan2(y1, x1);

        return this.wrapAngle(angle);
    }

    /**
     * Calculates the minimum (absolute) angle change for rotation
     * from one angle to another on the [-Pi, Pi] interval
     *
     * @param {number} angle1 The origin angle
     * @param {number} angle2 The destination angle
     */
    public angleDifference(angle1: number, angle2: number): number {
        let angle: number = angle2 - angle1;

        return this.wrapAngle(angle);
    }

    /**
     * Calculates the relative rotation angle between two
     * angle-axis vectors.
     *
     * @param {number} rotation1 First angle-axis vector
     * @param {number} rotation2 Second angle-axis vector
     */
    public relativeRotationAngle(rotation1: number[], rotation2: number[]): number {
        let R1T: THREE.Matrix4 = this.rotationMatrix(
            [-rotation1[0], -rotation1[1], -rotation1[2]]);
        let R2: THREE.Matrix4 = this.rotationMatrix(rotation2);

        let R: THREE.Matrix4 = R1T.multiply(R2);
        let elements: Float32Array = R.elements;

        // from Tr(R) = 1 + 2*cos(theta)
        let theta: number = Math.acos((elements[0] + elements[5] + elements[10] - 1) / 2);

        return theta;
    }

    /**
     * Calculates the angle from a vector to a plane.
     *
     * @param {Array<number>} vector The vector
     * @param {Array<number>} planeNormal Normal of the plane
     */
    public angleToPlane(vector: number[], planeNormal: number[]): number {
        let v: THREE.Vector3 = new THREE.Vector3().fromArray(vector);
        let norm: number = v.length();

        if (norm < this.epsilon) {
            return 0;
        }

        let projection: number = v.dot(new THREE.Vector3().fromArray(planeNormal));

        return Math.asin(projection / norm);
    }

    /**
     * Calculates the distance between two coordinates
     * (latitude longitude pairs) in meters according to
     * the haversine formula.
     *
     * @param {number} lat1 The latitude of the first coordinate
     * @param {number} lon1 The longitude of the first coordinate
     * @param {number} lat2 The latitude of the second coordinate
     * @param {number} lon2 The longitude of the second coordinate
     */
    public distanceFromLatLon(lat1: number, lon1: number, lat2: number, lon2: number): number {
        let r: number = 6371000;
        let dLat: number = this.degToRad(lat2 - lat1);
        let dLon: number = this.degToRad(lon2 - lon1);

        let hav: number =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        let d: number = 2 * r * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));

        return d;
    }
}

export default Spatial;
