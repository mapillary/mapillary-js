// Cluster reconstruction
export interface GraphCameraContract {
    focal: number;
    k1: number;
    k2: number;
    projection_type: string;
}

export interface GraphCameraShotContract {
    camera: string;
    rotation: number[];
    translation: number[];
}

export interface GraphReferenceContract {
    altitude: number;
    latitude: number;
    longitude: number;
}

export interface GraphPointContract {
    color: number[];
    coordinates: number[];
}

export interface GraphClusterContract {
    cameras: { [cameraId: string]: GraphCameraContract; };
    points: { [pointId: string]: GraphPointContract; };
    reference_lla: GraphReferenceContract,
    shots: { [imageKey: string]: GraphCameraShotContract; };
}

// General
export interface GraphError {
    error: {
        code: number;
        fbtrace_id: string;
        message: string;
        type: string;
    };
}
export interface GraphContract<T> {
    data: T;
}
