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
     * property will always be an empty array.
     */
    edges: IEdge[];
}

export default IEdgeStatus;
