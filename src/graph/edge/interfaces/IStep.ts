import {EdgeConstants} from "../../../Edge";

export interface IStep {
    direction: EdgeConstants.Direction;
    motionChange: number;
    useFallback: boolean;
}
