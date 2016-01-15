import {EdgeConstants} from "../../../Edge";

export interface IStep {
    direction: EdgeConstants.EdgeDirection;
    motionChange: number;
    useFallback: boolean;
}
