import { TagMode } from "../tag/TagMode";
import { ComponentEvent } from "./ComponentEvent";

/**
 * @event
 */
export interface ComponentTagModeEvent extends ComponentEvent {
    /**
     * Value indicating the current tag mode of the component.
     */
    mode: TagMode;

    type: "tagmode";
}
