import {
    CameraParameters,
    CameraUniforms,
    ICamera,
} from "./interfaces/ICamera";

export abstract class Camera implements ICamera {
    public readonly parameters: CameraParameters = {};
    public readonly uniforms: CameraUniforms = {};

    public projectToSfmFunction: string;

    constructor(public readonly type: string) { }

    public abstract bearingFromSfm(_point: number[]): number[];
    public abstract projectToSfm(_point: number[]): number[];
}
