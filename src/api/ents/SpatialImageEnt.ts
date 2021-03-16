import { CameraEnt } from "./CameraEnt";
import { ClusterEnt } from "./ClusterEnt";
import { IDEnt } from "./IDEnt";
import { URLImageEnt } from "./URLImageEnt";
import { UserEnt } from "./UserEnt";

/**
 * Interface that describes the raw spatial image properties.
 *
 * @interface SpatialImageEnt
 */
export interface SpatialImageEnt extends CameraEnt, URLImageEnt {
    /**
     * Original EXIF altitude above sea level, in meters.
     */
    altitude?: number;

    /**
     * Scale of atomic reconstruction.
     */
    atomic_scale?: number;

    /**
     * Rotation vector in angle axis representation.
     */
    computed_rotation?: number[];

    /**
     * Original EXIF compass angle, measured in degrees.
     */
    compass_angle: number;

    /**
     * Computed altitude, in meters.
     */
    computed_altitude?: number;

    /**
     * Timestamp when the image was captured.
     */
    captured_at: number;

    /**
     * SfM computed compass angle, measured in degrees.
     */
    computed_compass_angle?: number;

    /**
     * cluster to which the image belongs.
     */
    cluster?: ClusterEnt;

    /**
     * Height of original image, not adjusted for orientation.
     */
    height: number;

    /**
     * SfM connected component id to which the image belongs.
     */
    merge_cc?: number;

    /**
     * Version for which SfM was run and image was merged.
     */
    merge_version?: number;

    /**
     * Organization to which the image belongs.
     */
    organization?: IDEnt;

    /**
     * EXIF orientation of original image.
     */
    orientation: number;

    /**
     * Value specifying if image is accessible to organization members only
     * or to everyone.
     */
    private?: boolean;

    /**
     * Image quality score.
     */
    quality_score?: number;

    /**
     * User who created the image.
     */
    user?: UserEnt;

    /**
     * Width of original image, not adjusted for orientation.
     */
    width: number;
}
