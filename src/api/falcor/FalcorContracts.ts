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

export interface FalcorClusterContract {
    cameras: { [cameraId: string]: FalcorCameraContract };
    points: { [pointId: string]: FalcorPointContract };
    reference_lla: FalcorReferenceLlaContract,
    shots: { [imageKey: string]: FalcorCameraShotContract };
}

interface FalcorKey<T> {
    [key: string]: T
}

interface FalcorImageByKey<T> {
    imageByKey: FalcorKey<T>;
}

interface FalcorImagesByH {
    imagesByH: FalcorKey<FalcorKey<FalcorCoreImageEnt>>;
}

interface FalcorSequenceByKey {
    sequenceByKey: FalcorKey<FalcorSequenceEnt>;
}

export type FalcorImagesByHContract = JSONEnvelope<FalcorImagesByH>;
export type FalcorSequenceByKeyContract = JSONEnvelope<FalcorSequenceByKey>;
export type FalcorImageByKeyContract =
    JSONEnvelope<FalcorImageByKey<FalcorImageEnt>>;
export type FalcorSpatialImageByKeyContract =
    JSONEnvelope<FalcorImageByKey<FalcorSpatialImageEnt>>;
