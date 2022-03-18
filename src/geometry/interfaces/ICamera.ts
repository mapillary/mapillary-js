export interface ICamera {
    readonly parameters: { [key: string]: number; };
    readonly type: string;
    readonly uniforms: { [key: string]: number | number[]; };

    bearingFromSfm(point: number[]): number[];
    projectToSfm(bearing: number[]): number[];
}
