import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for viewer load events.
 *
 * @description Fired immediately after all necessary resources
 * have been downloaded and the first visually complete
 * rendering of the viewer has occurred.
 *
 * The visually complete rendering does not include custom
 * renderers.
 *
 * This event is only fired for viewer configurations where
 * the WebGL context is created, i.e. not when using the
 * fallback functionality only.
 *
 * @example
 * ```js
 * // Set up an event listener on the viewer.
 * viewer.on('load', function(e) {
 *   console.log('A load event has occured');
 * });
 * ```
 */
export interface ViewerLoadEvent extends ViewerEvent {
    type: "load";
}
