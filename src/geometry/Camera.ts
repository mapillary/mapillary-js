import {
    CameraParameters,
    CameraUniforms,
    ICamera,
} from "./interfaces/ICamera";

export abstract class Camera implements ICamera {
    public readonly parameters: CameraParameters = {};
    public readonly uniforms: CameraUniforms = {};

    constructor(
        public readonly type: string,
        public readonly projectToSfmFunction: string) { }

    public abstract bearingFromSfm(_point: number[]): number[];
    public abstract projectToSfm(_point: number[]): number[];
}
