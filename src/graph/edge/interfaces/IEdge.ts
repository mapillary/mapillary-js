import {EdgeDirection} from "../../../Edge";

/**
 * Interface that describes additional properties of an edge.
 * @interface IEdge
 */
export interface IEdgeData {
    /**
     * The counter clockwise horizontal rotation angle from
     * the X-axis in a spherical coordiante system of the
     * motion from the source node to the destination node.
     *
     * @propery {number} worldMotionAzimuth
     */
    worldMotionAzimuth: number;

    /**
     * The edge direction.
     *
     * @property {EdgeDirection} direction
     */
    direction: EdgeDirection;
}

/**
 * Interface that describes the properties for an edge from
 * a source node to a destination node.
 *
 * @interface IEdge
 */
export interface IEdge {
    /**
     * The key of the source node.
     *
     * @property {string} from
     */
    from: string;

    /**
     * The key of the destination node.
     *
     * @property {string} to
     */
    to: string;

    /**
     * Additional data describing properties of the edge.
     *
     * @property {IEdgeData} data
     */
    data: IEdgeData;
}

export default IEdge;
