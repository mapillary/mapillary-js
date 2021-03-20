/**
 * Interface that represents a reconstruction point.
 *
 * @interface PointContract
 */
export interface PointContract {
    /**
     * RGB color vector of the point.
     */
    color: number[];

    /**
     * Coordinates in metric scale in topocentric ENU
     * reference frame with respect to a geo reference.
     */
    coordinates: number[];
}
