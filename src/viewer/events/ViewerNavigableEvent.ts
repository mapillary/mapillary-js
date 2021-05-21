import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for navigable viewer events.
 */
export interface ViewerNavigableEvent extends ViewerEvent {
    /**
     * The navigable state indicates if the viewer supports
     * moving, i.e. calling the `moveTo` and `moveDir`
     * methods. The viewer will not be in a navigable state if the cover
     * is activated and the viewer has been supplied a id. When the cover
     * is deactivated or activated without being supplied a id it will
     * be navigable.
     */
    navigable: boolean;

    type: "navigable";
}
