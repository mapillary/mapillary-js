import { LngLat } from "../../api/interfaces/LngLat";
import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for mouse-related viewer events.
 *
 * @example
 * ```js
 * // The `click` event is an example of a `ViewerMouseEvent`.
 * // Set up an event listener on the viewer.
 * viewer.on('click', function(e) {
 *   // The event object contains information like the
 *   // coordinates of the point in the viewer that was clicked.
 *   console.log('A click event has occurred at ' + e.lngLat);
 * });
 * ```
 */
export interface ViewerMouseEvent extends ViewerEvent {
    /**
     * The basic coordinates in the current image of the mouse
     * event target.
     *
     * @description In some situations mouse events can occur outside of
     * the border of a image. In that case the basic coordinates will be
     * `null`.
     *
     * The basic point is only provided when the
     * {@link CameraControls.Street} mode is active. For all other camera
     * control modes, the basic point will be `null`.
     *
     * Basic coordinates are 2D coordinates on the [0, 1] interval
     * and has the origin point, (0, 0), at the top left corner and the
     * maximum value, (1, 1), at the bottom right corner of the original
     * image.
     */
    basicPoint: number[];

    /**
     * The geographic location in the viewer of the mouse event target.
     *
     * @description In some situations the viewer can not determine a valid
     * geographic location for the mouse event target. In that case the
     * geographic coordinates will be `null`.
     */
    lngLat: LngLat;

    /**
     * The pixel coordinates of the mouse event target, relative to
     * the viewer and measured from the top left corner.
     */
    pixelPoint: number[];

    /**
     * The original event that triggered the viewer event.
     */
    originalEvent: MouseEvent;

    /**
     * The event type.
     */
    type:
    | "click"
    | "contextmenu"
    | "dblclick"
    | "mousedown"
    | "mousemove"
    | "mouseout"
    | "mouseover"
    | "mouseup";
}
