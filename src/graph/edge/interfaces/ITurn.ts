import {EdgeDirection} from "../../../Edge";

export interface ITurn {
    direction: EdgeDirection;
    directionChange: number;
    motionChange?: number;
}
