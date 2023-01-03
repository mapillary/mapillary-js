import { ViewerEvent } from "./ViewerEvent";
import { Image } from "../../graph/Image";

/**
 * Interface for viewer image events.
 */
export interface ViewerImageEvent extends ViewerEvent {
    /**
     * The viewer's current image.
     *
     * @description If the viewer is reset, the emitted
     * image will be null.
     */
    image: Image | null;

    type: "image";
}
