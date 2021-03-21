import { CoreImageEnt } from "../ents/CoreImageEnt";

export interface CoreImagesContract {
    cell_id: string;
    images: CoreImageEnt[];
}
