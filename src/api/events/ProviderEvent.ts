import { IDataProvider } from "../interfaces/IDataProvider";
import { ProviderEventType } from "./ProviderEventType";

/**
 * Interface for general provider events.
 */
export interface ProviderEvent {
    /**
     * Data provider target that emitted the event.
     */
    target: IDataProvider;

    /**
     * Provider event type.
     */
    type: ProviderEventType;
}
