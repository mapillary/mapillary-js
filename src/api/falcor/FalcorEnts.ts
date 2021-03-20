export interface FalcorLatLon {
    lat: number;
    lon: number;
}

interface FalcorKeyEnt {
    key: string;
}

export interface FalcorUserEnt extends FalcorKeyEnt {
    username: string;
}

export interface FalcorCoreImageEnt extends FalcorKeyEnt {
    cl: FalcorLatLon,
    l: FalcorLatLon,
    sequence_key: string;
}

export interface FalcorSpatialImageEnt extends FalcorKeyEnt {
    altitude: number;
    atomic_scale: number;
    c_rotation: number[];
    ca: number;
    calt: number;
    camera_projection_type: string;
    captured_at: number;
    cca: number;
    cfocal: number;
    cluster_key: string;
    ck1: number;
    ck2: number;
    height: number;
    merge_cc: number;
    merge_version: number;
    organization_key: string;
    orientation: number;
    private: boolean;
    quality_score: number;
    user: FalcorUserEnt;
    width: number;
}

export interface FalcorImageEnt extends
    FalcorSpatialImageEnt,
    FalcorCoreImageEnt { }

export interface FalcorSequenceEnt {
    key?: string;
    keys?: string[];
}
