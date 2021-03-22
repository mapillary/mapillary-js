import { Viewer } from "../Viewer";

/**
 * @interface ViewerEvent
 *
 * Interface that represents an event occuring with the viewer as target.
 */
export interface ViewerEvent {
    /**
     * The viewer object that fired the event.
     */
    target: Viewer;

    /**
     * The event type.
     */
    type: string;
}
