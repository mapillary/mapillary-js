import {EdgeDirection} from "../../../Edge";

/**
 * Interface that describes additional properties of an edge.
 *
 * @interface IEdgeData
 */
export interface IEdgeData {
    /**
     * The edge direction.
     */
    direction: EdgeDirection;

    /**
     * The counter clockwise horizontal rotation angle from
     * the X-axis in a spherical coordiante system of the
     * motion from the source node to the destination node.
     */
    worldMotionAzimuth: number;
}

export default IEdgeData;
