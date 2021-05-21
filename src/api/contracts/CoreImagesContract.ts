import { CoreImageEnt } from "../ents/CoreImageEnt";

/**
 * Contract describing core image results.
 */
export interface CoreImagesContract {
    /**
     * Geometry cell ID.
     */
    cell_id: string;

    /**
     * Array of core image ents.
     */
    images: CoreImageEnt[];
}
