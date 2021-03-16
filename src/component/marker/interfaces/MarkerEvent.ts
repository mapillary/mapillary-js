import { Marker } from "../marker/Marker";
import { MarkerComponent } from "../MarkerComponent";

/**
 * @interface MarkerEvent
 *
 * Interface that represents a marker event occuring in the viewer target element.
 */
export interface MarkerEvent {
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
