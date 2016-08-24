import {IEdgeData} from "../../../Edge";

/**
 * Interface that describes the properties for an edge from
 * a source node to a destination node.
 *
 * @interface IEdge
 */
export interface IEdge {
    /**
     * The key of the source node.
     */
    from: string;

    /**
     * The key of the destination node.
     */
    to: string;

    /**
     * Additional data describing properties of the edge.
     */
    data: IEdgeData;
}

export default IEdge;
