import { ProviderEvent } from "./ProviderEvent";

/**
 *
 * Interface for data provider cell events.
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
