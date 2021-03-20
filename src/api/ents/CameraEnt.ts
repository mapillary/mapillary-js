/**
 * Interface that represents camera properties.
 *
 * @interface CameraEnt
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
     * parameters are unset or emtpy array.
     */
    camera_parameters?: number[];

    /**
     * Projection type of the camera.
     *
     * Supported camera types are :
     *
     * ```
     *   'spherical'
     *   'fisheye'
     *   'perspective'
     * ```
     */
    camera_type?: string;
}
