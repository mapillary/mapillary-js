import { JSONEnvelope } from "falcor";
import {
    FalcorCoreImageEnt,
    FalcorImageEnt,
    FalcorSequenceEnt,
    FalcorSpatialImageEnt,
} from "./FalcorEnts";

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
