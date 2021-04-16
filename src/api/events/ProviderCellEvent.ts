import { ProviderEvent } from "./ProviderEvent";

/**
 * @event
 */
export interface ProviderCellEvent extends ProviderEvent {
    /**
     * Cell ids for cells where data have been created.
     */
    cellIds: string[];

    /**
     * Provider event type.
     */
    type: "datacreate";
}
