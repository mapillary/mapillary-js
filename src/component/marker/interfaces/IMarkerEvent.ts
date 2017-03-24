import {
    Marker,
    MarkerComponent,
} from "../../../Component";

/**
 * @interface IMarkerEvent
 *
 * Interface that represents a marker event occuring in the viewer target element.
 */
export interface IMarkerEvent {
    /**
     * The marker that was affected by the event.
     */
    marker: Marker;

    /**
     * The marker component object that fired the event.
     */
    target: MarkerComponent;

    /**
     * The event type.
     */
    type: string;
}

export default IMarkerEvent;
