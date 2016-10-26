import {IEdge} from "../../Edge";

/**
 * Interface that indicates edge status.
 *
 * @interface IEdgeStatus
 */
export interface IEdgeStatus {
    /**
     * Value indicating whether the edges have been cached.
     */
    cached: boolean;

    /**
     * The edges.
     *
     * @description If the cached property is false the edges
     * property will always be an empty array. If the cached
     * property is true, there will exist edges in the the
     * array if the node has edges.
     */
    edges: IEdge[];
}

export default IEdgeStatus;
