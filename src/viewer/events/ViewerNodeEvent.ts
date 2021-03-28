import { ViewerEvent } from "./ViewerEvent";
import { Node } from "../../graph/Node";

/**
 * @event
 */
export interface ViewerNodeEvent extends ViewerEvent {
    /**
     * The viewer's current node.
     */
    node: Node;

    type: "node";
}
