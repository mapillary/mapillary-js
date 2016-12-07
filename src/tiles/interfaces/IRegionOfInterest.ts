import {IBoundingBox} from "../../Tiles";

export interface IRegionOfInterest {
    bbox: IBoundingBox;
    pixelWidth: number;   // width of the footprint of a canvas pixel in basic coordinates
    pixelHeight: number;  // height of the footprint of a canvas pixel in basic coordinates
}

export default IRegionOfInterest;
