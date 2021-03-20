import { DataProviderBase } from "../DataProviderBase";

/**
 * Data added event.
 *
 * @description Emitted when data has been added to a
 * data provider after initial load.
 *
 * @event DataAddedProviderEvent
 */
export interface DataAddedProviderEvent {
    /**
     * Event type.
     */
    type: "dataadded";

    /**
     * Data provider target that emitted the event.
     */
    target: DataProviderBase;

    /**
     * Ids of updated geometry cells.
     */
    cellIds: string[];
}
