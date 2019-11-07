import {Viewer} from "../../Viewer";

/**
 * @interface IViewerEvent
 *
 * Interface that represents an event occuring with the viewer as target.
 */
export interface IViewerEvent {
    /**
     * The viewer object that fired the event.
     */
    target: Viewer;

    /**
     * The event type.
     */
    type: string;
}

export default IViewerEvent;
