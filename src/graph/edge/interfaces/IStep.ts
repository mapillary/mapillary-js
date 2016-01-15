import {EdgeDirection} from "../../../Edge";

export interface IStep {
    direction: EdgeDirection;
    motionChange: number;
    useFallback: boolean;
}
