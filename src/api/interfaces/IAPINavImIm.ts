import {IGPano} from "../../API";

/**
 * Interface that describes the raw image response
 * from the API.
 *
 * @interface IAPINavImIm
 */
export interface IAPINavImIm {
    /**
     * Unique image key.
     */
    key: string;

    /**
     * Username of the user who uploaded the image.
     */
    user?: string;

    /**
     * SfM computed altitude, in meters.
     *
     * @description If SfM has not been run the computed altitude is
     * set to two meters.
     */
    calt?: number;

    /**
     * Rotation vector in angle axis representation.
     */
    rotation?: number[];

    /**
     * SfM computed compass angle.
     */
    cca?: number;

    /**
     * SfM computed focal lenght.
     */
    cfocal?: number;

    /**
     * Scale of atomic reconstruction.
     */
    atomic_scale?: number;

    /**
     * Camera mode.
     */
    camera_mode?: number;

    /**
     * Version for which SfM was run and image was merged.
     */
    merge_version?: number;

    /**
     * EXIF orientation of original image.
     */
    orientation?: number;

    /**
     * Width of original image, not adjusted for orientation.
     */
    width?: number;

    /**
     * Height of original image, not adjusted for orientation.
     */
    height?: number;

    /**
     * Timestamp when the image was captured.
     */
    captured_at?: number;

    /**
     * 35 millimeter focal lenght.
     */
    fmm35?: number;

    /**
     * Original EXIF latitude in WGS84 datum, measured in degrees.
     */
    lat?: number;

    /**
     * Original EXIF longitude in WGS84 datum, measured in degrees.
     */
    lon?: number;

    /**
     * Original EXIF compass angle.
     */
    ca?: number;

    /**
     * SfM connected component key to which image belongs.
     */
    merge_cc?: number;

    /**
     * SfM computed latitude, measured in degrees.
     */
    clat?: number;

    /**
     * SfM computed longitude, measured in degrees.
     */
    clon?: number;

    /**
     * Panorama information for panorama images.
     */
    gpano?: IGPano;
}

export default IAPINavImIm;
