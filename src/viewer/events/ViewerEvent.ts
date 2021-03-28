import { IViewer } from "../interfaces/IViewer";
import { ViewerEventType } from "./ViewerEventType";

/**
 * @event
 */
export interface ViewerEvent {
    /**
     * The viewer object that fired the event.
     */
    target: IViewer;

    /**
     * The event type.
     */
    type: ViewerEventType;
}
