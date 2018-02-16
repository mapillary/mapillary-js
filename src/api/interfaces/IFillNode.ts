import {IGPano, IProject, IUser} from "../../API";

/**
 * Interface that describes the raw filling node properties.
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
     * Original EXIF compass angle, measured in degrees.
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
     * Universally unique id for camera used when capturing
     * image.
     */
    captured_with_camera_uuid?: string;

    /**
     * SfM computed compass angle, measured in degrees.
     */
    cca?: number;

    /**
     * SfM computed focal length.
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
     * SfM connected component key to which the image belongs.
     */
    merge_cc?: number;

    /**
     * Version for which SfM was run and image was merged.
     */
    merge_version?: number;

    /**
     * Key of the organization to which the image belongs.
     */
    organization_key?: string;

    /**
     * EXIF orientation of original image.
     */
    orientation?: number;

    /**
     * Value specifying if image is accessible to organization members only
     * or to everyone.
     */
    private: boolean;

    /**
     * Project the image belongs to.
     */
    project?: IProject;

    /**
     * User who uploaded the image.
     */
    user: IUser;

    /**
     * Width of original image, not adjusted for orientation.
     */
    width: number;
}

export default IFillNode;
