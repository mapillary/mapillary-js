import { IDEnt } from "./IDEnt";
import { LngLat } from "../interfaces/LngLat";

/**
 * Ent representing core image properties.
 */
export interface CoreImageEnt extends IDEnt {
    /**
     * SfM computed longitude, latitude in WGS84 datum, measured in degrees.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_geometry?: LngLat;

    /**
     * Original EXIF longitude, latitude in WGS84 datum, measured in degrees.
     */
    geometry: LngLat;

    /**
     * Sequence that the image is part of.
     */
    sequence: IDEnt;
}
