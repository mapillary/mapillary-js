import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for viewer reset events.
 *
 * @description Fired immediately after all resources
 * have been cleared.
 *
 * @example
 * ```js
 * // Set up an event listener on the viewer.
 * viewer.on('reset', function(e) {
 *   console.log('A reset event has occured');
 * });
 * ```
 */
export interface ViewerResetEvent extends ViewerEvent {
    type: "reset";
}
