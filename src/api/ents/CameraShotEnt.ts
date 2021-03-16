/**
 * Interface that represents a shot (a camera frame) in a
 * reconstruction.
 *
 * @interface CameraShotEnt
 */
export interface CameraShotEnt {
    /**
     * Key of the camera for the shot.
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
