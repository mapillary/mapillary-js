/**
 * Interface that represents a camera type in a
 * reconstruction.
 *
 * @interface CameraEnt
 */
export interface CameraEnt {
    /**
     * SfM computed focal length.
     */
    focal: number;

    /**
     * SfM computed radial distortion parameter.
     */
    k1: number;

    /**
     * SfM computed radial distortion parameter.
     */
    k2: number;

    /**
     * Projection type of the camera.
     */
    projection_type: string;
}
