import { NavigationEdgeStatus }
    from "../../graph/interfaces/NavigationEdgeStatus";
import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for navigation edge viewer events.
 */
export interface ViewerNavigationEdgeEvent extends ViewerEvent {
    /**
     * The viewer's current navigation edge status.
     */
    status: NavigationEdgeStatus;

    type:
    | "sequenceedges"
    | "spatialedges";
}
