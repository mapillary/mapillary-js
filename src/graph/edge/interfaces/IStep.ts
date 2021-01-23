import { EdgeDirection } from "../EdgeDirection";

export interface IStep {
    direction: EdgeDirection;
    motionChange: number;
    useFallback: boolean;
}
