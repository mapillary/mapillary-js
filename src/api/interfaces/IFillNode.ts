import { IGPano, IProject, IUser } from "../../API";
import { CameraProjectionType } from "./CameraProjectionType";
import INodeUrls from "./INodeUrls";

/**
 * Interface that describes the raw filling node properties.
 *
 * @interface ISpatialNode
 */
export interface IFillNode extends INodeUrls {
    /**
     * Original EXIF altitude above sea level, in meters.
     */
    altitude?: number;

    /**
     * Scale of atomic reconstruction.
     */
    atomic_scale?: number;

    /**
     * Key of SfM cluster that the node is part of.
     */
    cluster_key: string;

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
     * SfM computed radial distortion parameter.
     */
    ck1?: number;

    /**
     * SfM computed radial distortion parameter.
     */
    ck2?: number;

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
     * Image quality score.
     */
    quality_score?: number;

    /**
     * Projection type of captured image.
     */
    camera_projection_type?: CameraProjectionType;

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
