import { ComponentEvent } from "./ComponentEvent";

/**
 * Interface for component play events.
 */
export interface ComponentPlayEvent extends ComponentEvent {
    /**
     * Value indiciating if the component is playing or not.
     */
    playing: boolean;

    type: "playing";
}
