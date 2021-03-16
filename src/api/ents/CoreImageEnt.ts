import { KeyedEnt } from "./KeyedEnt";
import { LatLonEnt } from "./LatLonEnt";

/**
 * Interface that describes the raw core node properties.
 *
 * @interface CoreImageEnt
 */
export interface CoreImageEnt extends KeyedEnt {
    /**
     * SfM computed latitude longitude in WGS84 datum, measured in degrees.
     */
    cl?: LatLonEnt;

    /**
     * Original EXIF latitude longitude in WGS84 datum, measured in degrees.
     */
    l: LatLonEnt;

    /**
     * Key of sequence that the node is part of.
     */
    sequence_key: string;
}
