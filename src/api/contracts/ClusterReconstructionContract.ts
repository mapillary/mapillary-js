import { CameraContract } from "./CameraContract";
import { CameraShotContract } from "./CameraShotContract";
import { LngLatAlt } from "../interfaces/LngLatAlt";
import { PointContract } from "./PointContract";

export interface ClusterReconstructionContract {
    /**
     * The unique id of the reconstruction.
     */
    id: string;

    /**
     * The cameras of the reconstruction.
     */
    cameras: { [cameraId: string]: CameraContract };

    /**
     * The points of the reconstruction.
     */
    points: { [pointId: string]: PointContract };

    /**
     * The reference longitude, latitude, altitude of
     * the reconstruction. Determines the
     * position of the reconstruction in world reference
     * frame.
     */
    reference: LngLatAlt;

    /**
     * The shots of the reconstruction.
     */
    shots: { [imageId: string]: CameraShotContract };
}
