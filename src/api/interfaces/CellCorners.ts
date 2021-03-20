import { LatLon } from "./LatLon";

/**
 * Interface that describes a cell neighbors object.
 *
 * @interface CellNeighbors
 */
export interface CellNeighbors {
    /**
     * East neighbor.
     */
    e: string;

    /**
     * North neighbor.
     */
    n: string;

    /**
     * North east neighbor.
     */
    ne: string;

    /**
     * North west neighbor.
     */
    nw: string;

    /**
     * South neighbor.
     */
    s: string;

    /**
     * South east neighbor.
     */
    se: string;

    /**
     * South west neighbor.
     */
    sw: string;

    /**
     * West neighbor.
     */
    w: string;
}

/**
 * Interface that describes a cell corners object.
 *
 * @interface CellCorners
 */
export interface CellCorners {
    /**
     * North east corner.
     */
    ne: LatLon;

    /**
     * North west corner.
     */
    nw: LatLon;

    /**
     * South east corner.
     */
    se: LatLon;

    /**
     * South west corner.
     */
    sw: LatLon;
}
