import { LngLatAlt } from "../interfaces/LngLatAlt";
import { PointContract } from "./PointContract";

/**
 * Contract describing cluster reconstruction data.
 */
export interface ClusterContract {
    /**
     * The unique id of the cluster.
     */
    id: string;

    /**
     * The points of the reconstruction.
     */
    points: { [pointId: string]: PointContract; };

    /**
     * The reference longitude, latitude, altitude of
     * the reconstruction. Determines the
     * position of the reconstruction in world reference
     * frame.
     */
    reference: LngLatAlt;
}
