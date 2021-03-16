import { IAnimationState } from "./IAnimationState";

export interface AnimationFrame {
    id: number;
    fps: number;
    state: IAnimationState;
}
