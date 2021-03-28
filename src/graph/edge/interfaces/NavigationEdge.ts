import { NavigationEdgeData } from "./NavigationEdgeData";

/**
 * Interface that describes the properties for a
 * navigation edge from a source image to a
 * target image.
 *
 * @interface NavigationEdge
 */
export interface NavigationEdge {
    /**
     * The id of the source image.
     */
    source: string;

    /**
     * The id of the target image.
     */
    target: string;

    /**
     * Additional data describing properties of the edge.
     */
    data: NavigationEdgeData;
}
