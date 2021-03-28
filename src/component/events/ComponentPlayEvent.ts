import { ComponentEvent } from "./ComponentEvent";

/**
 * @event
 */
export interface ComponentPlayEvent extends ComponentEvent {
    /**
     * Value indiciating if the component is playing or not.
     */
    playing: boolean;

    type: "playing";
}
