/**
 * Enumeration for camera controls.
 *
 * @description Specifies different modes for how the
 * camera is controlled through pointer and keyboard
 * input.
 *
 * @enum {number}
 * @readonly
 */
export enum CameraControls {
    /**
     * Control the camera in a first person view
     * from the street level perspective.
     */
    Street,

    /**
     * Control the camera from a birds perspective
     * to get an overview.
     */
    Earth,
}
