import { ProviderEvent } from "./ProviderEvent";

/**
 *
 * Interface for data provider cluster events.
 */
export interface ProviderClusterEvent extends ProviderEvent {
    /**
     * Cluster ids for clusters that have been deleted.
     */
    clusterIds: string[];

    /**
     * Provider event type.
     */
    type: "datadelete";
}
