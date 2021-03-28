import { ViewerEvent } from "./ViewerEvent";

/**
 * @event
 */
export interface ViewerLoadingEvent extends ViewerEvent {
    /**
     * Indicates if the viewer is loading data.
     */
    loading: boolean;

    type: "loading";
}
