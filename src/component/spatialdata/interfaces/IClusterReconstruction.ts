import {IReconstructionPoint} from "../../../Component";
import IGeoReference from "./IGeoReference";
import { CameraProjection } from "../../../api/interfaces/CameraProjection";

export interface IShot {
    camera: string;
    rotation: number[];
    translation: number[];
}

export interface ICamera {
    focal: number;
    k1: number;
    k2: number;
    projection_type: CameraProjection;
}

export interface IClusterReconstruction {
    key: string;
    cameras: { [key: string]: ICamera };
    points: { [id: string]: IReconstructionPoint };
    reference_lla: IGeoReference;
    shots: { [key: string]: IShot };
}

export default IClusterReconstruction;
