export interface ICamera {
    readonly parameters: number[];
    readonly type: string;

    bearing(point: number[]): number[];
    project(point: number[]): number[];
}
