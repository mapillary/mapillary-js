import { IKey } from "./IKey";
import { ILatLon } from "./ILatLon";

/**
 * Interface that describes the raw core node properties.
 *
 * @interface ICoreNode
 */
export interface ICoreNode extends IKey {
    /**
     * SfM computed latitude longitude in WGS84 datum, measured in degrees.
     */
    cl?: ILatLon;

    /**
     * Original EXIF latitude longitude in WGS84 datum, measured in degrees.
     */
    l: ILatLon;

    /**
     * Key of sequence that the node is part of.
     */
    sequence_key?: string;
}
