import { DataProviderBase } from "../DataProviderBase";
import { ProviderEventType } from "./ProviderEventType";

/**
 * @event
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
