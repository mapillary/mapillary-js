import { ComponentEvent } from "./ComponentEvent";

/**
 * Interface for component hover events.
 */
export interface ComponentHoverEvent extends ComponentEvent {
    /**
     * The image id corresponding to the element or object that
     * is being hovered. When the mouse leaves the element or
     * object the id will be null.
     */
    id: string;

    type: "hover";
}
