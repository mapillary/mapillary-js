import * as THREE from "three";

import {Transform} from "../Geo";

/**
 * @class Camera
 *
 * @classdesc Holds information about a camera.
 */
export class Camera {
    private _position: THREE.Vector3;
    private _lookat: THREE.Vector3;
    private _up: THREE.Vector3;
    private _focal: number;

    /**
     * Create a new camera instance.
     * @param {Transform} [transform] - Optional transform instance.
     */
    constructor(transform?: Transform) {
        if (transform != null) {
            this._position = new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 0));
            this._lookat = new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 10));
            this._up = transform.upVector();
            this._focal = this._getFocal(transform);
        } else {
            this._position = new THREE.Vector3(0, 0, 0);
            this._lookat = new THREE.Vector3(0, 0, 1);
            this._up = new THREE.Vector3(0, -1, 0);
            this._focal = 1;
        }
    }

   /**
    * Get position.
    * @returns {THREE.Vector3} The position vector.
    */
    public get position(): THREE.Vector3 {
        return this._position;
    }

   /**
    * Get lookat.
    * @returns {THREE.Vector3} The lookat vector.
    */
    public get lookat(): THREE.Vector3 {
        return this._lookat;
    }

   /**
    * Get up.
    * @returns {THREE.Vector3} The up vector.
    */
    public get up(): THREE.Vector3 {
        return this._up;
    }

   /**
    * Get focal.
    * @returns {number} The focal length.
    */
    public get focal(): number {
        return this._focal;
    }

   /**
    * Set focal.
    */
    public set focal(value: number) {
        this._focal = value;
    }

    /**
     * Update this camera to the linearly interpolated value of two other cameras.
     *
     * @param {Camera} a - First camera.
     * @param {Camera} b - Second camera.
     * @param {number} alpha - Interpolation value on the interval [0, 1].
     */
    public lerpCameras(a: Camera, b: Camera, alpha: number): void {
      this._position.subVectors(b.position, a.position).multiplyScalar(alpha).add(a.position);
      this._lookat.subVectors(b.lookat, a.lookat).multiplyScalar(alpha).add(a.lookat);
      this._up.subVectors(b.up, a.up).multiplyScalar(alpha).add(a.up);
      this._focal = (1 - alpha) * a.focal + alpha * b.focal;
    }

    /**
     * Copy the properties of another camera to this camera.
     *
     * @param {Camera} other - Another camera.
     */
    public copy(other: Camera): void {
        this._position.copy(other.position);
        this._lookat.copy(other.lookat);
        this._up.copy(other.up);
        this._focal = other.focal;
    }

    /**
     * Clone this camera.
     *
     * @returns {Camera} A camera with cloned properties equal to this camera.
     */
    public clone(): Camera {
        let camera: Camera = new Camera();

        camera.position.copy(this._position);
        camera.lookat.copy(this._lookat);
        camera.up.copy(this._up);
        camera.focal = this._focal;

        return camera;
    }

    /**
     * Determine the distance between this camera and another camera.
     *
     * @param {Camera} other - Another camera.
     * @returns {number} The distance between the cameras.
     */
    public diff(other: Camera): number {
        let pd: number = this._position.distanceToSquared(other.position);
        let ld: number = this._lookat.distanceToSquared(other.lookat);
        let ud: number = this._up.distanceToSquared(other.up);
        let fd: number = 100 * Math.abs(this._focal - other.focal);

        return Math.max(pd, ld, ud, fd);
    }

    /**
     * Get the focal length based on the transform.
     *
     * @description Returns the focal length of the transform if gpano info is not available.
     * Returns a focal length corresponding to a vertical fov clamped to [45, 90] degrees based on
     * the gpano information if available.
     *
     * @returns {number} Focal length.
     */
    private _getFocal(transform: Transform): number {
        if (transform.gpano == null) {
            return transform.focal;
        }

        let vFov: number = Math.PI * transform.gpano.CroppedAreaImageHeightPixels / transform.gpano.FullPanoHeightPixels;
        let focal: number = 0.5 / Math.tan(vFov / 2);

        return Math.min(1 / (2 * (Math.sqrt(2) - 1)), Math.max(0.5, focal));
    }
}
