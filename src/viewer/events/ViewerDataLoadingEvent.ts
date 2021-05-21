import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for viewer data loading events.
 *
 * @description Fired when any viewer data (image, mesh, metadata, etc)
 * begins loading or changing asyncronously as a result of viewer
 * navigation.
 *
 * Also fired when the data has finished loading and the viewer
 * is able to perform the navigation.
 */
export interface ViewerDataLoadingEvent extends ViewerEvent {
    /**
     * Indicates if the viewer navigation is awaiting data load.
     */
    loading: boolean;

    type: "dataloading";
}
