import { EdgeDirection } from "../EdgeDirection";

export interface ITurn {
    direction: EdgeDirection;
    directionChange: number;
    motionChange?: number;
}
