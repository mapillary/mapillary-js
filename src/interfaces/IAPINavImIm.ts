/* Interfaces */
import INumberArray from "./INumberArray";

export interface IAPINavImIm {
    user: string;
    key: string;
    calt: number;
    rotation: INumberArray;
    cca: number;
    cfocal: number;
    atomic_scale: number;
    camera_mode: number;
    merge_version: number;
    orientation: number;
    width: number;
    height: number;
    captured_at: number;
    fmm35: number;
    lat: number;
    lon: number;
    ca: number;
    merge_cc: number;
    clat: number;
    clon: number;
}

export default IAPINavImIm;
