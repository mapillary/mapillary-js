import {EdgeConstants} from "../../../Edge";

export interface ITurn {
    direction: EdgeConstants.Direction;
    directionChange: number;
    motionChange?: number;
}
