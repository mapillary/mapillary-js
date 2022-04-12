import { ICamera } from "./ICamera";

export interface ICameraFactory {
    makeCamera(type: string, parameters: number[]): ICamera;
}
