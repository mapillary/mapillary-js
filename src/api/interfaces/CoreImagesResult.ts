import { CoreImageEnt } from "../ents/CoreImageEnt";

export interface CoreImagesResult {
    [cellId: string]: {
        [index: string]: CoreImageEnt;
    };
}
