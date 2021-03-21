import { IDEnt } from "./IDEnt";
import { LatLon } from "../interfaces/LatLon";

/**
 * Interface that describes the raw core node properties.
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
    computed_geometry?: LatLon;

    /**
     * Original EXIF latitude longitude in WGS84 datum, measured in degrees.
     */
    geometry: LatLon;

    /**
     * Sequence that the node is part of.
     */
    sequence: IDEnt;
}
