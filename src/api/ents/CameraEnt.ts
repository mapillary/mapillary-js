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
    cfocal?: number;

    /**
     * SfM computed radial distortion parameter.
     */
    ck1?: number;

    /**
     * SfM computed radial distortion parameter.
     */
    ck2?: number;

    /**
     * Projection type of the camera.
     */
    camera_type?: string;
}
