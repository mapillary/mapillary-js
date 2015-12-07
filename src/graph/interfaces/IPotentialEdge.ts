import {IAPINavImIm} from "../../API";

/**
 * Interface that describes the properties for a node that is the destination of a
 * potential edge from an origin node.
 *
 * @interface IPotentialEdge
 */
export interface IPotentialEdge {
    /**
     * Distance to the origin node.
     * @property {number} distance
     */
    distance: number;

    /**
     * Change in motion with respect to the viewing direction
     * of the origin node.
     * @property {number} motionChange
     */
    motionChange: number;

    /**
     * Change in viewing direction with respect to the origin node.
     * @property {number} directionChange
     */
    directionChange: number;

    /**
     * General camera rotation with respect to the origin node.
     * @property {number} rotation
     */
    rotation: number;

    /**
     * APINavImIm properties of destination node.
     * @property {IAPINavImIm} apiNavImIm
     */
    apiNavImIm: IAPINavImIm;
}

export default IPotentialEdge;
