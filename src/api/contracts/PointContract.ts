/**
 * Contract describing a reconstruction point.
 */
export interface PointContract {
    /**
     * RGB color vector of the point, normalized to floats
     * on the interval [0, 1];
     */
    color: number[];

    /**
     * Coordinates in metric scale in topocentric ENU
     * reference frame with respect to a geo reference.
     */
    coordinates: number[];
}
