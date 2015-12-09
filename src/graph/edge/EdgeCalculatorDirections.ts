import {EdgeConstants, IStep, ITurn} from "../../Edge";

export class EdgeCalculatorDirections {

    public steps: { [direction: string]: IStep } = {};
    public turns: { [direction: string]: ITurn } = {};

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

        this.turns[EdgeConstants.Direction.TURN_LEFT] = {
            direction: EdgeConstants.Direction.TURN_LEFT,
            directionChange: Math.PI / 2,
            motionChange: Math.PI / 4
        };

        this.turns[EdgeConstants.Direction.TURN_RIGHT] = {
            direction: EdgeConstants.Direction.TURN_RIGHT,
            directionChange: -Math.PI / 2,
            motionChange: -Math.PI / 4
        };

        this.turns[EdgeConstants.Direction.TURN_U] = {
            direction: EdgeConstants.Direction.TURN_U,
            directionChange: Math.PI,
            motionChange: null
        };
    }
}
