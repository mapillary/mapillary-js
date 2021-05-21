import { Geometry } from "../tag/geometry/Geometry";
import { ComponentEvent } from "./ComponentEvent";

/**
 * Interface for component geometry events.
 */
export interface ComponentGeometryEvent extends ComponentEvent {
    /**
     * Geometry related to the event.
     */
    geometry: Geometry;

    type: "geometrycreate";
}
