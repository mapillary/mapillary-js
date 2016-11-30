import {IBoundingBox} from "../../Tiles";

export interface IRegionOfInterest {
    bbox: IBoundingBox;
    viewportHeight: number;
    viewportWidth: number;
}

export default IRegionOfInterest;
