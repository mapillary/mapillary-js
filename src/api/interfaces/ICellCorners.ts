import ILatLon from "./ILatLon";

/**
 * Interface that describes a cell neighbors object.
 *
 * @interface ICellNeighbors
 */
export interface ICellNeighbors {
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
 * @interface ICellCorners
 */
export interface ICellCorners {
    /**
     * North east corner.
     */
    ne: ILatLon;

    /**
     * North west corner.
     */
    nw: ILatLon;

    /**
     * South east corner.
     */
    se: ILatLon;

    /**
     * South west corner.
     */
    sw: ILatLon;
}

export default ICellCorners;
