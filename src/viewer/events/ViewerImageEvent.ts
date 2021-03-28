import { ViewerEvent } from "./ViewerEvent";
import { Image } from "../../graph/Image";

/**
 * @event
 */
export interface ViewerImageEvent extends ViewerEvent {
    /**
     * The viewer's current image.
     */
    image: Image;

    type: "image";
}
