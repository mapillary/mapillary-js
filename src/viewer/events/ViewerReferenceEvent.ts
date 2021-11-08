import { LngLatAlt } from "../../external/api";
import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for viewer reference events.
 */
export interface ViewerReferenceEvent extends ViewerEvent {
    /**
     * The viewer's current reference.
     */
    reference: LngLatAlt;

    type: "reference";
}
