import {IBoundingBox} from "../../Tiles";

/**
 * Interface that describes a region of interest..
 *
 * @interface IRegionOfInterest
 */
export interface IRegionOfInterest {
    /**
     * The bounding box for the region of interest in basic coordinates.
     */
    bbox: IBoundingBox;

    /**
     * Width of the footprint of a canvas pixel in basic coordinates.
     */
    pixelWidth: number;

    /**
     * Height of the footprint of a canvas pixel in basic coordinates.
     */
    pixelHeight: number;
}

export default IRegionOfInterest;
