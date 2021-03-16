import { IDEnt } from "./IDEnt";
import { LatLonEnt } from "./LatLonEnt";

/**
 * Interface that describes the raw core node properties.
 *
 * @interface CoreImageEnt
 */
export interface CoreImageEnt extends IDEnt {
    /**
     * SfM computed latitude longitude in WGS84 datum, measured in degrees.
     */
    computed_geometry?: LatLonEnt;

    /**
     * Original EXIF latitude longitude in WGS84 datum, measured in degrees.
     */
    geometry: LatLonEnt;

    /**
     * Sequence that the node is part of.
     */
    sequence: IDEnt;
}
