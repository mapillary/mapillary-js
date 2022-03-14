import { LngLat } from "../../api/interfaces/LngLat";
import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for drag end viewer events.
 *
 * @example
 * ```js
 * // Set up an event listener on the viewer.
 * viewer.on('dragened', function(e) {
 *   console.log(e.originalEvent);
 * });
 * ```
 */
export interface ViewerDragEndEvent extends ViewerEvent {
    /**
     * The original event that triggered the viewer event.
     */
    originalEvent: MouseEvent | FocusEvent;

    /**
     * The event type.
     */
    type: "dragend";
}
