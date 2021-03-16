import { SpatialImageEnt } from "./SpatialImageEnt";
import { CoreImageEnt } from "./CoreImageEnt";

/**
 * Interface that describes the raw image properties.
 *
 * @interface ImageEnt
 */
export interface ImageEnt extends CoreImageEnt, SpatialImageEnt { }
