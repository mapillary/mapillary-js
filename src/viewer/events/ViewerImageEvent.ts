import { ViewerEvent } from "./ViewerEvent";
import { Image } from "../../graph/Image";

/**
 * Interface for viewer image events.
 */
export interface ViewerImageEvent extends ViewerEvent {
    /**
     * The viewer's current image.
     */
    image: Image;

    type: "image";
}
