import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for viewer state events.
 *
 * @example
 * ```js
 * // The `fov` event is an example of a `ViewerStateEvent`.
 * // Set up an event listener on the viewer.
 * viewer.on('fov', function(e) {
 *   console.log('A fov event has occured');
 * });
 * ```
 */
export interface ViewerStateEvent extends ViewerEvent {
    /**
     * The event type.
     */
    type:
    | "fov"
    | "moveend"
    | "movestart"
    | "position"
    | "pov"
    | "remove";
}
