import { CameraEnt } from "../ents/CameraEnt";

/**
 * Interface that represents a camera type in a
 * reconstruction.
 *
 * @interface CameraContract
 */
export interface CameraContract extends CameraEnt {
    /**
     * Id of the camera.
     */
    id: string;
}
