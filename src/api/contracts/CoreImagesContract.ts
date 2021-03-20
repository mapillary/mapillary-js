import { CoreImageEnt } from "../ents/CoreImageEnt";

export interface CoreImagesContract {
    [cellId: string]: {
        [index: string]: CoreImageEnt;
    };
}
