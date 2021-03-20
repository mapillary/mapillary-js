import { SpatialImageEnt } from "../ents/SpatialImageEnt";

export interface SpatialImagesContract {
    [imageId: string]: SpatialImageEnt;
}
