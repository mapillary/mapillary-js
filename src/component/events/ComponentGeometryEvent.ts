import { Geometry } from "../tag/geometry/Geometry";
import { ComponentEvent } from "./ComponentEvent";

/**
 * @event
 */
export interface ComponentGeometryEvent extends ComponentEvent {
    /**
     * Geometry related to the event.
     */
    geometry: Geometry;

    type: "geometrycreated";
}
