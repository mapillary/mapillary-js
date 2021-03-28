import { NavigationEdge } from "../edge/interfaces/NavigationEdge";

/**
 * Interface that indicates edge status.
 *
 * @interface NavigationEdgeStatus
 */
export interface NavigationEdgeStatus {
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
     * array if the image has edges.
     */
    edges: NavigationEdge[];
}
