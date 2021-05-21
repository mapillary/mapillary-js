import { ViewerEvent } from "./ViewerEvent";

/**
 * Interface for bearing viewer events.
 */
export interface ViewerBearingEvent extends ViewerEvent {
    /**
     * Bearing is measured in degrees
     * clockwise with respect to north.
     *
     * @description Bearing is related to the computed
     * compass angle ({@link Image.computedCompassAngle})
     * from SfM, not the original EXIF compass angle.
     */
    bearing: number;

    type: "bearing";
}
