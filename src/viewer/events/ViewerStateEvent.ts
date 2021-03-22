import { NavigationEdgeStatus } from "../../graph/interfaces/NavigationEdgeStatus";
import { Node } from "../../graph/Node";
import { IViewer } from "../interfaces/IViewer";

/**
 * @interface ViewerStateEvent
 *
 * `ViewerStateEvent` is the event type for viewer state changes.
 *
 * @example
 * // The `bearing` event is an example of a `ViewerStateEvent`.
 * // Set up an event listener on the viewer.
 * viewer.on('bearing', function(e) {
 *   console.log('A bearing event has occured ' + e.bearing);
 * });
 */
export interface ViewerStateEvent {
    /**
     * The viewer object that fired the event.
     */
    target: IViewer;

    /**
     * The event type.
     */
    type:
    | "bearing"
    | "fov"
    | "loading"
    | "moveend"
    | "movestart"
    | "navigable"
    | "node"
    | "position"
    | "pov"
    | "remove"
    | "sequenceedges"
    | "spatialedges";
}

export interface ViewerBearingEvent extends ViewerStateEvent {
    /**
     * Bearing is measured in degrees
     * clockwise with respect to north.
     *
     * @description Bearing is related to the computed
     * compass angle ({@link Node.computedCompassAngle})
     * from SfM, not the original EXIF compass angle.
     */
    bearing: number;
}

export interface ViewerLoadingEvent extends ViewerStateEvent {
    /**
     * Indicates if the viewer is loading data.
     */
    loading: boolean;
}

export interface ViewerNavigableEvent extends ViewerStateEvent {
    /**
     * The navigable state indicates if the viewer supports
     * moving, i.e. calling the `moveTo` and `moveDir`
     * methods. The viewer will not be in a navigable state if the cover
     * is activated and the viewer has been supplied a id. When the cover
     * is deactivated or activated without being supplied a id it will
     * be navigable.
     */
    navigable: boolean;
}

export interface ViewerNodeEvent extends ViewerStateEvent {
    /**
     * The viewer's current node.
     */
    node: Node;
}

export interface ViewerNavigationEdgeStatusEvent extends ViewerStateEvent {
    /**
     * The viewer's current node edge status.
     */
    status: NavigationEdgeStatus;
}
