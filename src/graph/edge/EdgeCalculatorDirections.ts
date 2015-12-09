import {EdgeConstants, IStep} from "../../Edge";

export class EdgeCalculatorDirections {

    public steps: { [direction: string]: IStep } = {};

    constructor() {
        this.steps[EdgeConstants.Direction.STEP_FORWARD] = {
            direction: EdgeConstants.Direction.STEP_FORWARD,
            motionChange: 0,
            useFallback: true
        };

        this.steps[EdgeConstants.Direction.STEP_BACKWARD] = {
            direction: EdgeConstants.Direction.STEP_BACKWARD,
            motionChange: Math.PI,
            useFallback: true
        };

        this.steps[EdgeConstants.Direction.STEP_LEFT] = {
            direction: EdgeConstants.Direction.STEP_LEFT,
            motionChange: Math.PI / 2,
            useFallback: false
        };

        this.steps[EdgeConstants.Direction.STEP_RIGHT] = {
            direction: EdgeConstants.Direction.STEP_RIGHT,
            motionChange: -Math.PI / 2,
            useFallback: false
        };
    }
}
