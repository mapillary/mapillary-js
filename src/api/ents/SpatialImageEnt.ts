import { CameraEnt } from "./CameraEnt";
import { URLEnt } from "./URLEnt";
import { IDEnt } from "./IDEnt";
import { CreatorEnt } from "./CreatorEnt";

/**
 * Ent representing spatial image properties.
 */
export interface SpatialImageEnt extends CameraEnt, IDEnt {
    /**
     * Original EXIF altitude above sea level, in meters.
     */
    altitude: number;

    /**
     * Scale of atomic reconstruction.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    atomic_scale?: number;

    /**
     * Timestamp representing the capture date and time.
     *
     * @description Unix epoch timestamp in milliseconds.
     */
    captured_at: number;

    /**
     * Original EXIF compass angle, measured in degrees.
     */
    compass_angle: number;

    /**
     * Computed altitude, in meters.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_altitude?: number;

    /**
     * SfM computed compass angle, measured in degrees.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_compass_angle?: number;

    /**
     * Rotation vector in angle axis representation.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_rotation?: number[];

    /**
     * Cluster reconstruction to which the image belongs.
     */
    cluster: URLEnt;

    /**
     * Image creator.
     */
    creator: CreatorEnt;

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
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    merge_id?: string;

    /**
     * 3D mesh resource.
     */
    mesh: URLEnt;

    /**
     * Owner to which the image belongs.
     */
    owner: IDEnt;

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
     * Image thumbnail resource.
     */
    thumb: URLEnt;

    /**
     * Width of original image, not adjusted for orientation.
     */
    width: number;
}
