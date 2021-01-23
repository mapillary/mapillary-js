import { ICurrentState } from "./ICurrentState";

export interface IFrame {
    id: number;
    fps: number;
    state: ICurrentState;
}
