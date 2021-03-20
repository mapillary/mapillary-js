import { CameraEnt } from "./CameraEnt";
import { ClusterEnt } from "./ClusterEnt";
import { IDEnt } from "./IDEnt";
import { URLImageEnt } from "./URLImageEnt";
import { CreatorEnt } from "./CreatorEnt";

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
     * Image creator.
     */
    creator?: CreatorEnt;

    /**
     * EXIF orientation of original image.
     */
    exif_orientation: number;

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
     * Owner to which the image belongs.
     */
    owner?: IDEnt;

    /**
     * Value specifying if image is accessible to organization members only
     * or to everyone.
     */
    private?: boolean;

    /**
     * Image quality score on the interval [0, 1].
     */
    quality_score?: number;

    /**
     * Width of original image, not adjusted for orientation.
     */
    width: number;
}
