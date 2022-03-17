import { MapillaryError } from "../error/MapillaryError";
import { ICamera } from "./interfaces/ICamera";

export abstract class Camera implements ICamera {
    constructor(
        public readonly type: string,
        public readonly parameters: number[]) { }

    public bearing(_point: number[]): number[] {
        throw new MapillaryError("Not implemented");
    }

    public project(_point: number[]): number[] {
        throw new MapillaryError("Not implemented");
    }
}
