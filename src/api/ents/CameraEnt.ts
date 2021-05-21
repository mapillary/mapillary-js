/**
 * Ent representing camera properties.
 */
export interface CameraEnt {
    /**
     * Camera type dependent camera parameters.
     *
     * For perspective and fisheye camera types,
     * the camera parameters array should be
     * constructed according to
     *
     * `[focal, k1, k2]`
     *
     * where focal is the camera focal length,
     * and k1, k2 are radial distortion parameters.
     *
     * For spherical camera type the camera
     * parameters should be an emtpy array.
     */
    camera_parameters: number[];

    /**
     * Projection type of the camera.
     *
     * @description Supported camera types are:
     *
     * ```js
     *   'spherical'
     *   'fisheye'
     *   'perspective'
     * ```
     *
     * Other camera types will be treated as
     * perspective images.
     */
    camera_type: string;
}
