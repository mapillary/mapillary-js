import {
    IKey,
    ILatLon,
} from "../../API";

/**
 * Interface that describes the raw core image properties.
 *
 * @interface ICoreNode
 */
export interface ICoreNode extends IKey {
    /**
     * Original EXIF latitude longitude in WGS84 datum, measured in degrees.
     */
    l: ILatLon;

    /**
     * SfMComputed EXIF longitude in WGS84 datum, measured in degrees.
     */
    cl?: ILatLon;

    /**
     * Sequence that the node is part of.
     */
    sequence: IKey;
}

export default ICoreNode;
