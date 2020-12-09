import CameraProjectionType from "./CameraProjectionType";

/**
 * Interface that represents a camera type in a cluster
 * reconstruction.
 *
 * @interface ICamera
 */
export interface ICamera {
    /**
     * SfM computed focal length.
     */
    focal: number;

    /**
     * SfM computed radial distortion parameter.
     */
    k1: number;

    /**
     * SfM computed radial distortion parameter.
     */
    k2: number;

    /**
     * Projection type of the camera.
     */
    projection_type: CameraProjectionType;
}

/**
 * Interface that represents a latitude-longitude reference
 * of a cluster reconstruction, measured in degrees and an
 * altitude in meters. Coordinates are defined in the WGS84 datum.
 *
 * @interface IGeoReference
 */
export interface IGeoReference {
    /**
     * Altitude, measured in meters.
     */
    altitude: number;

    /**
     * Latitude, measured in degrees.
     */
    latitude: number;

    /**
     * Longitude, measured in degrees.
     */
    longitude: number;
}

/**
 * Interface that represents a cluster reconstruction point.
 *
 * @interface IReconstructionPoint
 */
export interface IReconstructionPoint {
    /**
     * RGB color vector of the point.
     */
    color: number[];

    /**
     * Coordinates in metric scale in topocentric ENU
     * reference frame with respect to a geo reference.
     */
    coordinates: number[];
}

/**
 * Interface that represents a shot (a camera frame) in a cluster
 * reconstruction.
 *
 * @interface IShot
 */
export interface IShot {
    /**
     * Key of the camera for the shot.
     */
    camera: string;

    /**
     * Rotation vector in angle axis representation.
     */
    rotation: number[];

    /**
     * The translation in meters in topocentric ENU
     * reference frame.
     */
    translation: number[];
}

export interface IClusterReconstruction {
    /**
     * The unique key of the reconstruction.
     */
    key: string;

    /**
     * The cameras of the reconstruction.
     */
    cameras: { [key: string]: ICamera };

    /**
     * The points of the reconstruction.
     */
    points: { [id: string]: IReconstructionPoint };

    /**
     * The reference of the reconstruction. Determines the
     * position of the reconstruction in world reference
     * frame.
     */
    reference_lla: IGeoReference;

    /**
     * The shots of the reconstruction.
     */
    shots: { [key: string]: IShot };
}

export default IClusterReconstruction;
