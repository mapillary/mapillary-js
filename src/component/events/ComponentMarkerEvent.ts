import { Marker } from "../marker/marker/Marker";
import { ComponentEvent } from "./ComponentEvent";

/**
 * @event
 */
export interface ComponentMarkerEvent extends ComponentEvent {
    /**
     * The marker that was affected by the event.
     */
    marker: Marker;

    type:
    | "markerdragend"
    | "markerdragstart"
    | "markerposition";
}
