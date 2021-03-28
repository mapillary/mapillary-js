import { NavigationEdgeStatus }
    from "../../graph/interfaces/NavigationEdgeStatus";
import { ViewerEvent } from "./ViewerEvent";

/**
 * @event
 */
export interface ViewerNavigationEdgeEvent extends ViewerEvent {
    /**
     * The viewer's current node edge status.
     */
    status: NavigationEdgeStatus;

    type:
    | "sequenceedges"
    | "spatialedges";
}
