import {EdgeConstants, IStep, ITurn, IPano, IRotation} from "../../Edge";

export class EdgeCalculatorDirections {

    public steps: { [direction: string]: IStep } = {};
    public turns: { [direction: string]: ITurn } = {};
    public panos: { [direction: string]: IPano } = {};
    public rotations: { [direction: string]: IRotation } = {};

    constructor() {
        this.steps[EdgeConstants.Direction.STEP_FORWARD] = {
            direction: EdgeConstants.Direction.STEP_FORWARD,
            motionChange: 0,
            useFallback: true,
        };

        this.steps[EdgeConstants.Direction.STEP_BACKWARD] = {
            direction: EdgeConstants.Direction.STEP_BACKWARD,
            motionChange: Math.PI,
            useFallback: true,
        };

        this.steps[EdgeConstants.Direction.STEP_LEFT] = {
            direction: EdgeConstants.Direction.STEP_LEFT,
            motionChange: Math.PI / 2,
            useFallback: false,
        };

        this.steps[EdgeConstants.Direction.STEP_RIGHT] = {
            direction: EdgeConstants.Direction.STEP_RIGHT,
            motionChange: -Math.PI / 2,
            useFallback: false,
        };

        this.turns[EdgeConstants.Direction.TURN_LEFT] = {
            direction: EdgeConstants.Direction.TURN_LEFT,
            directionChange: Math.PI / 2,
            motionChange: Math.PI / 4,
        };

        this.turns[EdgeConstants.Direction.TURN_RIGHT] = {
            direction: EdgeConstants.Direction.TURN_RIGHT,
            directionChange: -Math.PI / 2,
            motionChange: -Math.PI / 4,
        };

        this.turns[EdgeConstants.Direction.TURN_U] = {
            direction: EdgeConstants.Direction.TURN_U,
            directionChange: Math.PI,
            motionChange: null,
        };

        this.panos[EdgeConstants.Direction.STEP_FORWARD] = {
            direction: EdgeConstants.Direction.STEP_FORWARD,
            directionChange: 0,
            next: EdgeConstants.Direction.STEP_LEFT,
            prev: EdgeConstants.Direction.STEP_RIGHT,
        };

        this.panos[EdgeConstants.Direction.STEP_BACKWARD] = {
            direction: EdgeConstants.Direction.STEP_BACKWARD,
            directionChange: Math.PI,
            next: EdgeConstants.Direction.STEP_RIGHT,
            prev: EdgeConstants.Direction.STEP_LEFT,
        };

        this.panos[EdgeConstants.Direction.STEP_LEFT] = {
            direction: EdgeConstants.Direction.STEP_LEFT,
            directionChange: Math.PI / 2,
            next: EdgeConstants.Direction.STEP_BACKWARD,
            prev: EdgeConstants.Direction.STEP_FORWARD,
        };

        this.panos[EdgeConstants.Direction.STEP_RIGHT] = {
            direction: EdgeConstants.Direction.STEP_RIGHT,
            directionChange: -Math.PI / 2,
            next: EdgeConstants.Direction.STEP_FORWARD,
            prev: EdgeConstants.Direction.STEP_BACKWARD,
        };

        this.rotations[EdgeConstants.Direction.ROTATE_LEFT] = {
            direction: EdgeConstants.Direction.ROTATE_LEFT,
            directionChangeSign: 1,
        };

        this.rotations[EdgeConstants.Direction.ROTATE_RIGHT] = {
            direction: EdgeConstants.Direction.ROTATE_RIGHT,
            directionChangeSign: -1,
        };
    }
}
