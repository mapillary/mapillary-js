import { MapillaryError } from "../error/MapillaryError";
import { ICamera } from "./interfaces/ICamera";

export abstract class Camera implements ICamera {
    public readonly parameters: { [key: string]: number; } = {};
    public readonly uniforms: { [key: string]: number | number[]; } = {};

    constructor(public readonly type: string) { }

    public bearingFromSfm(_point: number[]): number[] {
        throw new MapillaryError("Not implemented");
    }

    public projectToSfm(_point: number[]): number[] {
        throw new MapillaryError("Not implemented");
    }
}
