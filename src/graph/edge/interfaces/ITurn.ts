import {EdgeConstants} from "../../../Edge";

export interface ITurn {
    direction: EdgeConstants.EdgeDirection;
    directionChange: number;
    motionChange?: number;
}
