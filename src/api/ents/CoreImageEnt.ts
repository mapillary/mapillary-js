import { IDEnt } from "./IDEnt";
import { LngLat } from "../interfaces/LngLat";

/**
 * Interface that describes the raw core image properties.
 *
 * @interface CoreImageEnt
 */
export interface CoreImageEnt extends IDEnt {
    /**
     * SfM computed latitude longitude in WGS84 datum, measured in degrees.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_geometry?: LngLat;

    /**
     * Original EXIF latitude longitude in WGS84 datum, measured in degrees.
     */
    geometry: LngLat;

    /**
     * Sequence that the image is part of.
     */
    sequence: IDEnt;
}
