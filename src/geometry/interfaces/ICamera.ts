export type CameraParameters = { [key: string]: number; };
export type CameraUniforms = { [key: string]: boolean | number | number[]; };

export interface ICamera {
    readonly type: string;

    readonly parameters: CameraParameters;
    readonly uniforms: CameraUniforms;

    readonly projectToSfmFunction: string;

    bearingFromSfm(point: number[]): number[];
    projectToSfm(bearing: number[]): number[];
}
