import {IGPano, IUser} from "../../API";

/**
 * Interface that describes the raw filling image properties.
 *
 * @interface ISpatialNode
 */
export interface IFillNode {
    /**
     * Scale of atomic reconstruction.
     */
    atomic_scale?: number;

    /**
     * Rotation vector in angle axis representation.
     */
    c_rotation?: number[];

    /**
     * Original EXIF compass angle.
     */
    ca: number;

    /**
     * SfM computed altitude, in meters.
     *
     * @description If SfM has not been run the computed altitude is
     * set to two meters.
     */
    calt?: number;

    /**
     * Timestamp when the image was captured.
     */
    captured_at: number;

    /**
     * SfM computed EXIF compass angle.
     */
    cca?: number;

    /**
     * SfM computed focal lenght.
     */
    cfocal?: number;

    /**
     * Panorama information for panorama images.
     */
    gpano?: IGPano;

    /**
     * Height of original image, not adjusted for orientation.
     */
    height: number;

    /**
     * SfM connected component key to which image belongs.
     */
    merge_cc?: number;

    /**
     * Version for which SfM was run and image was merged.
     */
    merge_version?: number;

    /**
     * EXIF orientation of original image.
     */
    orientation?: number;

    /**
     * User key of the user who uploaded the image.
     */
    user: IUser;

    /**
     * Width of original image, not adjusted for orientation.
     */
    width: number;
}

export default IFillNode;
