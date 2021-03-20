import { ImageEnt } from "../ents/ImageEnt";

export interface ImagesContract {
    [imageId: string]: ImageEnt;
}
