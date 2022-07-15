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
     *
     * @description The points are represented in local topocentric
     * ENU coordinates relative to the cluster reference longitude,
     * latitude, altitude.
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
