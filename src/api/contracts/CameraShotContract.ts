/**
 * Interface that represents a camera shot
 * (or camera frame) in a reconstruction.
 *
 * @interface CameraShotContract
 */
export interface CameraShotContract {
    /**
     * Id of the camera for the shot.
     */
    camera: string;

    /**
     * Rotation vector in angle axis representation.
     */
    rotation: number[];

    /**
     * The translation in meters in topocentric ENU
     * reference frame.
     */
    translation: number[];
}
