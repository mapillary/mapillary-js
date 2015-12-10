import {IGPano} from "../../API";

export interface IAPINavImIm {
    key: string;
    user?: string;
    calt?: number;
    rotation?: number[];
    cca?: number;
    cfocal?: number;
    atomic_scale?: number;
    camera_mode?: number;
    merge_version?: number;
    orientation?: number;
    width?: number;
    height?: number;
    captured_at?: number;
    fmm35?: number;
    lat?: number;
    lon?: number;
    ca?: number;
    merge_cc?: number;
    clat?: number;
    clon?: number;
    gpano?: IGPano;
}

export default IAPINavImIm;
