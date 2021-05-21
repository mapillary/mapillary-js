import { DataProviderBase } from "../DataProviderBase";
import { ProviderEventType } from "./ProviderEventType";

/**
 * Interface for general provider events.
 */
export interface ProviderEvent {
    /**
     * Data provider target that emitted the event.
     */
    target: DataProviderBase;

    /**
     * Provider event type.
     */
    type: ProviderEventType;
}
