import { JSONEnvelope } from "falcor";
import {
    FalcorCoreImageEnt,
    FalcorImageEnt,
    FalcorSequenceEnt,
    FalcorSpatialImageEnt,
} from "./FalcorEnts";

export interface FalcorCameraContract {
    focal: number;
    k1: number;
    k2: number;
    projection_type: string;
}

export interface FalcorCameraShotContract {
    camera: string;
    rotation: number[];
    translation: number[];
}

export interface FalcorReferenceLlaContract {
    altitude: number;
    latitude: number;
    longitude: number;
}

export interface FalcorPointContract {
    color: number[];
    coordinates: number[];
}

export interface FalcorClusterReconstructionContract {
    cameras: { [cameraId: string]: FalcorCameraContract };
    points: { [pointId: string]: FalcorPointContract };
    reference_lla: FalcorReferenceLlaContract,
    key: string;
    shots: { [imageKey: string]: FalcorCameraShotContract };
}

interface KeyFalcorResult<T> {
    [key: string]: T
}

interface ImageByKeyResult<T> {
    imageByKey: KeyFalcorResult<T>;
}

interface ImagesByHResult {
    imagesByH: KeyFalcorResult<KeyFalcorResult<FalcorCoreImageEnt>>;
}

interface SequenceByKeyResult {
    sequenceByKey: KeyFalcorResult<FalcorSequenceEnt>;
}

export type ImagesByH = JSONEnvelope<ImagesByHResult>;
export type SequenceByKey = JSONEnvelope<SequenceByKeyResult>;
export type ImageByKey = JSONEnvelope<ImageByKeyResult<FalcorImageEnt>>;
export type SpatialImageByKey =
    JSONEnvelope<ImageByKeyResult<FalcorSpatialImageEnt>>;
