import { CameraEnt } from "./CameraEnt";
import { CameraShotEnt } from "./CameraShotEnt";
import { LatLonAltEnt } from "./LatLonAltEnt";
import { PointEnt } from "./PointEnt";

export interface ClusterReconstructionEnt {
    /**
     * The unique id of the reconstruction.
     */
    id: string;

    /**
     * The cameras of the reconstruction.
     */
    cameras: { [id: string]: CameraEnt };

    /**
     * The points of the reconstruction.
     */
    points: { [id: string]: PointEnt };

    /**
     * The reference latitude, longitue, altitude of
     * the reconstruction. Determines the
     * position of the reconstruction in world reference
     * frame.
     */
    reference: LatLonAltEnt;

    /**
     * The shots of the reconstruction.
     */
    shots: { [id: string]: CameraShotEnt };
}
