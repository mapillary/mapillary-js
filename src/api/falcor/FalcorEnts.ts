import { CameraShotEnt } from "../ents/CameraShotEnt";
import { LatLon } from "../interfaces/LatLon";
import { PointEnt } from "../ents/PointEnt";
import { SpatialImageEnt } from "../ents/SpatialImageEnt";
import { UserEnt } from "../ents/UserEnt";

interface FalcorKeyEnt {
    key: string;
}

export interface FalcorUserEnt extends
    FalcorKeyEnt,
    UserEnt { }

export interface FalcorCameraEnt {
    cfocal: number;
    ck1: number;
    ck2: number;
    focal: number;
    k1: number;
    k2: number;
    projection_type: string;
}

export interface FalcorClusterReconstructionEnt {
    cameras: { [cameraId: string]: FalcorCameraEnt };
    points: { [pointId: string]: PointEnt };
    reference_lla: {
        altitude: number,
        latitude: number,
        longitude: number,
    },
    key: string;
    shots: { [imageKey: string]: CameraShotEnt };
}

export interface FalcorCoreImageEnt extends FalcorKeyEnt {
    cl: LatLon,
    l: LatLon,
    sequence_key: string;
}

export interface FalcorSpatialImageEnt extends
    SpatialImageEnt,
    FalcorCameraEnt,
    FalcorKeyEnt {
    c_rotation: number[];
    ca: number;
    calt: number;
    camera_projection_type: string;
    cca: number;
    cluster_key: string;
    organization_key: string;
    user: FalcorUserEnt;
}

export interface FalcorImageEnt extends
    FalcorSpatialImageEnt,
    FalcorCoreImageEnt { }

export interface FalcorSequenceEnt {
    key?: string;
    keys?: string[];
}
