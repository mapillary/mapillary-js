/**
 * Enumeration for camera controls.
 *
 * @description Specifies different modes for how the
 * camera is controlled through pointer, keyboard or
 * other modes of input.
 *
 * @enum {number}
 * @readonly
 */
export enum CameraControls {
    /**
     * Control the camera with custom logic by
     * attaching a custom camera controls
     * instance to the {@link Viewer}.
     */
    Custom,

    /**
     * Control the camera from a birds perspective
     * to get an overview.
     */
    Earth,

    /**
     * Control the camera in a first person view
     * from the street level perspective.
     */
    Street,
}
