import { IComponent } from "../interfaces/IComponent";
import { ComponentEventType } from "./ComponentEventType";

/**
 * Interface for general component events.
 */
export interface ComponentEvent {
    /**
     * The component object that fired the event.
     */
    target: IComponent;

    /**
     * The event type.
     */
    type: ComponentEventType;
}
