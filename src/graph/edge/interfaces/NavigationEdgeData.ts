import { NavigationDirection } from "../NavigationDirection";

/**
 * Interface that describes additional properties of an edge.
 *
 * @interface NavigationEdgeData
 */
export interface NavigationEdgeData {
    /**
     * The edge direction.
     */
    direction: NavigationDirection;

    /**
     * The counter clockwise horizontal rotation angle from
     * the X-axis in a spherical coordiante system of the
     * motion from the source image to the destination node.
     */
    worldMotionAzimuth: number;
}
