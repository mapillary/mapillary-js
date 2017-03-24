import {ILatLon} from "../../API";
import {Viewer} from "../../Viewer";

/**
 * @interface IViewerMouseEvent
 *
 * Interface that represents a mouse event occuring in the viewer target element.
 */
export interface IViewerMouseEvent {
    /**
     * The basic coordinates in the current photo of the mouse
     * event target.
     *
     * @description In some situations mouse events can occur outside of
     * the border of a photo. In that case the basic coordinates will be
     * `null`.
     */
    basicPoint: number[];

    /**
     * The geographic location in the viewer of the mouse event target.
     *
     * @description In some situations the viewer can not determine a valid
     * geographic location for the mouse event target. In that case the
     * geographic coordinates will be `null`.
     */
    latLon: ILatLon;

    /**
     * The pixel coordinates of the mouse event target, relative to
     * the viewer and measured from the top left corner.
     */
    pixelPoint: number[];

    /**
     * The original event that triggered the viewer event.
     */
    originalEvent: MouseEvent;

    /**
     * The viewer object that fired the event.
     */
    target: Viewer;

    /**
     * The event type.
     */
    type: string;
}

export default IViewerMouseEvent;
