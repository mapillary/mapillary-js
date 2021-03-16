import { TileBoundingBox } from "./TileBoundingBox";

/**
 * Interface that describes a region of interest.
 *
 * @interface TileRegionOfInterest
 */
export interface TileRegionOfInterest {
    /**
     * The bounding box for the region of interest in basic coordinates.
     */
    bbox: TileBoundingBox;

    /**
     * Width of the footprint of a canvas pixel in basic coordinates.
     */
    pixelWidth: number;

    /**
     * Height of the footprint of a canvas pixel in basic coordinates.
     */
    pixelHeight: number;
}
