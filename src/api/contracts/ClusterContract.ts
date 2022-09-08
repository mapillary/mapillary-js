import { LngLatAlt } from "../interfaces/LngLatAlt";

/**
 * Contract describing cluster reconstruction data.
 */
export interface ClusterContract {
    /**
     * The unique id of the cluster.
     */
    id: string;

    /**
     * The IDs of the points.
     *
     * @description The order of the IDs correspond with the order
     * of the color and coordinate arrays.
     */
    pointIds: string[];

    /**
     * The colors of the reconstruction.
     *
     * @description The colors are represented as RGB values
     * normalized to floats on the interval [0, 1].
     *
     * Colors are ordered according to the point IDs in
     * a flattened array.
     */
    colors: number[];

    /**
     * The points of the reconstruction.
     *
     * @description The points are represented in local topocentric
     * ENU coordinates in metric scale relative to the cluster
     * reference longitude, latitude, altitude.
     *
     * Coordinates are ordered according to the point IDs in
     * a flattened array.
     */
    coordinates: number[];

    /**
     * The reference longitude, latitude, altitude of
     * the reconstruction. Determines the
     * position of the reconstruction in world reference
     * frame.
     */
    reference: LngLatAlt;

    /**
     * Rotation vector of the cluster in angle axis representation.
     *
     * @description The rotation vector is indepenent of the coordinates,
     * i.e. it is not applied when visualizing point clouds.
     */
    rotation: number[];
}
