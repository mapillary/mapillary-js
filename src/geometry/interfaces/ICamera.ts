export type CameraParameters = { [key: string]: number; };

export type CameraUniforms = { [key: string]: boolean | number | number[]; };

/**
 * @interface
 *
 * @description Interface for cameras. This is a
 * specification for implementers to model: it is not
 * an exported method or class.
 *
 * Implmenting a custom camera allows the implementer to
 * render textures and camera frustums with proper undistortion.
 *
 * Custom cameras must have a unique type.
 */
export interface ICamera {
    readonly type: string;

    readonly parameters: CameraParameters;
    readonly uniforms: CameraUniforms;

    readonly projectToSfmFunction: string;

    bearingFromSfm(point: number[]): number[];
    projectToSfm(bearing: number[]): number[];
}

export interface CameraConstructor {
    new(parameters: number[]): ICamera;
};
