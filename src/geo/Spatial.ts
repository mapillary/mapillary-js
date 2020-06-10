import * as THREE from "three";

/**
 * @class Spatial
 *
 * @classdesc Provides methods for scalar, vector and matrix calculations.
 */
export class Spatial {
    private _epsilon: number = 1e-9;

    /**
     * Converts azimuthal phi rotation (counter-clockwise with origin on X-axis) to
     * bearing (clockwise with origin at north or Y-axis).
     *
     * @param {number} phi - Azimuthal phi angle in radians.
     * @returns {number} Bearing in radians.
     */
    public azimuthalToBearing(phi: number): number {
         return -phi + Math.PI / 2;
    }

    /**
     * Converts degrees to radians.
     *
     * @param {number} deg - Degrees.
     * @returns {number} Radians.
     */
    public degToRad(deg: number): number {
        return Math.PI * deg / 180;
    }

    /**
     * Converts radians to degrees.
     *
     * @param {number} rad - Radians.
     * @returns {number} Degrees.
     */
    public radToDeg(rad: number): number {
        return 180 * rad / Math.PI;
    }

    /**
     * Creates a rotation matrix from an angle-axis vector.
     *
     * @param {Array<number>} angleAxis - Angle-axis representation of a rotation.
     * @returns {THREE.Matrix4} Rotation matrix.
     */
    public rotationMatrix(angleAxis: number[]): THREE.Matrix4 {
        let axis: THREE.Vector3 =
            new THREE.Vector3(angleAxis[0], angleAxis[1], angleAxis[2]);
        let angle: number = axis.length();
        if (angle > 0) {
            axis.normalize();
        }

        return new THREE.Matrix4().makeRotationAxis(axis, angle);
    }

    /**
     * Rotates a vector according to a angle-axis rotation vector.
     *
     * @param {Array<number>} vector - Vector to rotate.
     * @param {Array<number>} angleAxis - Angle-axis representation of a rotation.
     * @returns {THREE.Vector3} Rotated vector.
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
     * according to C = -R^T t.
     *
     * @param {Array<number>} rotation - Angle-axis representation of a rotation.
     * @param {Array<number>} translation - Translation vector.
     * @returns {THREE.Vector3} Optical center.
     */
    public opticalCenter(rotation: number[], translation: number[]): THREE.Vector3 {
        let angleAxis: number[] = [-rotation[0], -rotation[1], -rotation[2]];
        let vector: number[] = [-translation[0], -translation[1], -translation[2]];

        return this.rotate(vector, angleAxis);
    }

    /**
     * Calculates the viewing direction from a rotation vector
     * on the angle-axis representation.
     *
     * @param {number[]} rotation - Angle-axis representation of a rotation.
     * @returns {THREE.Vector3} Viewing direction.
     */
    public viewingDirection(rotation: number[]): THREE.Vector3 {
        let angleAxis: number[] = [-rotation[0], -rotation[1], -rotation[2]];

        return this.rotate([0, 0, 1], angleAxis);
    }

    /**
     * Wrap a number on the interval [min, max].
     *
     * @param {number} value - Value to wrap.
     * @param {number} min - Lower endpoint of interval.
     * @param {number} max - Upper endpoint of interval.
     * @returns {number} The wrapped number.
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
     * Wrap an angle on the interval [-Pi, Pi].
     *
     * @param {number} angle - Value to wrap.
     * @returns {number} Wrapped angle.
     */
    public wrapAngle(angle: number): number {
        return this.wrap(angle, -Math.PI, Math.PI);
    }

    /**
     * Limit the value to the interval [min, max] by changing the value to
     * the nearest available one when it is outside the interval.
     *
     * @param {number} value - Value to clamp.
     * @param {number} min - Minimum of the interval.
     * @param {number} max - Maximum of the interval.
     * @returns {number} Clamped value.
     */
    public clamp(value: number, min: number, max: number): number {
        if (value < min) {
            return min;
        }

        if (value > max) {
            return max;
        }

        return value;
    }

    /**
     * Calculates the counter-clockwise angle from the first
     * vector (x1, y1)^T to the second (x2, y2)^T.
     *
     * @param {number} x1 - X coordinate of first vector.
     * @param {number} y1 - Y coordinate of first vector.
     * @param {number} x2 - X coordinate of second vector.
     * @param {number} y2 - Y coordinate of second vector.
     * @returns {number} Counter clockwise angle between the vectors.
     */
    public angleBetweenVector2(x1: number, y1: number, x2: number, y2: number): number {
        let angle: number = Math.atan2(y2, x2) - Math.atan2(y1, x1);

        return this.wrapAngle(angle);
    }

    /**
     * Calculates the minimum (absolute) angle change for rotation
     * from one angle to another on the [-Pi, Pi] interval.
     *
     * @param {number} angle1 - Start angle.
     * @param {number} angle2 - Destination angle.
     * @returns {number} Absolute angle change between angles.
     */
    public angleDifference(angle1: number, angle2: number): number {
        let angle: number = angle2 - angle1;

        return this.wrapAngle(angle);
    }

    /**
     * Calculates the relative rotation angle between two
     * angle-axis vectors.
     *
     * @param {number} rotation1 - First angle-axis vector.
     * @param {number} rotation2 - Second angle-axis vector.
     * @returns {number} Relative rotation angle.
     */
    public relativeRotationAngle(rotation1: number[], rotation2: number[]): number {
        let R1T: THREE.Matrix4 = this.rotationMatrix(
            [-rotation1[0], -rotation1[1], -rotation1[2]]);
        let R2: THREE.Matrix4 = this.rotationMatrix(rotation2);

        let R: THREE.Matrix4 = R1T.multiply(R2);
        let elements: number[] = R.elements;

        // from Tr(R) = 1 + 2 * cos(theta)
        let tr: number = elements[0] + elements[5] + elements[10];
        let theta: number = Math.acos(Math.max(Math.min((tr - 1) / 2, 1), -1));

        return theta;
    }

    /**
     * Calculates the angle from a vector to a plane.
     *
     * @param {Array<number>} vector - The vector.
     * @param {Array<number>} planeNormal - Normal of the plane.
     * @returns {number} Angle from between plane and vector.
     */
    public angleToPlane(vector: number[], planeNormal: number[]): number {
        let v: THREE.Vector3 = new THREE.Vector3().fromArray(vector);
        let norm: number = v.length();

        if (norm < this._epsilon) {
            return 0;
        }

        let projection: number = v.dot(new THREE.Vector3().fromArray(planeNormal));

        return Math.asin(projection / norm);
    }

    public azimuthal(direction: number[], up: number[]): number {
        const directionVector: THREE.Vector3 = new THREE.Vector3().fromArray(direction);
        const upVector: THREE.Vector3 = new THREE.Vector3().fromArray(up);

        const upProjection: number = directionVector.clone().dot(upVector);
        const planeProjection: THREE.Vector3 = directionVector.clone().sub(upVector.clone().multiplyScalar(upProjection));

        return Math.atan2(planeProjection.y, planeProjection.x);
    }

    /**
     * Calculates the distance between two coordinates
     * (latitude longitude pairs) in meters according to
     * the haversine formula.
     *
     * @param {number} lat1 - Latitude of the first coordinate in degrees.
     * @param {number} lon1 - Longitude of the first coordinate in degrees.
     * @param {number} lat2 - Latitude of the second coordinate in degrees.
     * @param {number} lon2 - Longitude of the second coordinate in degrees.
     * @returns {number} Distance between lat lon positions in meters.
     */
    public distanceFromLatLon(lat1: number, lon1: number, lat2: number, lon2: number): number {
        let r: number = 6371000;
        let dLat: number = this.degToRad(lat2 - lat1);
        let dLon: number = this.degToRad(lon2 - lon1);

        let hav: number =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        let d: number = 2 * r * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));

        return d;
    }
}

export default Spatial;
