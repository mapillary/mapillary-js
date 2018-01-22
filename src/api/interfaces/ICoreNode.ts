import {
    IKey,
    ILatLon,
} from "../../API";

/**
 * Interface that describes the raw core node properties.
 *
 * @interface ICoreNode
 */
export interface ICoreNode extends IKey {
    /**
     * Original EXIF latitude longitude in WGS84 datum, measured in degrees.
     */
    l: ILatLon;

    /**
     * SfM computed latitude longitude in WGS84 datum, measured in degrees.
     */
    cl?: ILatLon;

    /**
     * Key of sequence that the node is part of.
     */
    sequence_key?: string;
}

export default ICoreNode;
