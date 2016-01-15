import {EdgeDirection, IStep, ITurn, IPano, IRotation} from "../../Edge";

export class EdgeCalculatorDirections {

    public steps: { [direction: string]: IStep } = {};
    public turns: { [direction: string]: ITurn } = {};
    public panos: { [direction: string]: IPano } = {};
    public rotations: { [direction: string]: IRotation } = {};

    constructor() {
        this.steps[EdgeDirection.STEP_FORWARD] = {
            direction: EdgeDirection.STEP_FORWARD,
            motionChange: 0,
            useFallback: true,
        };

        this.steps[EdgeDirection.STEP_BACKWARD] = {
            direction: EdgeDirection.STEP_BACKWARD,
            motionChange: Math.PI,
            useFallback: true,
        };

        this.steps[EdgeDirection.STEP_LEFT] = {
            direction: EdgeDirection.STEP_LEFT,
            motionChange: Math.PI / 2,
            useFallback: false,
        };

        this.steps[EdgeDirection.STEP_RIGHT] = {
            direction: EdgeDirection.STEP_RIGHT,
            motionChange: -Math.PI / 2,
            useFallback: false,
        };

        this.turns[EdgeDirection.TURN_LEFT] = {
            direction: EdgeDirection.TURN_LEFT,
            directionChange: Math.PI / 2,
            motionChange: Math.PI / 4,
        };

        this.turns[EdgeDirection.TURN_RIGHT] = {
            direction: EdgeDirection.TURN_RIGHT,
            directionChange: -Math.PI / 2,
            motionChange: -Math.PI / 4,
        };

        this.turns[EdgeDirection.TURN_U] = {
            direction: EdgeDirection.TURN_U,
            directionChange: Math.PI,
            motionChange: null,
        };

        this.panos[EdgeDirection.STEP_FORWARD] = {
            direction: EdgeDirection.STEP_FORWARD,
            directionChange: 0,
            next: EdgeDirection.STEP_LEFT,
            prev: EdgeDirection.STEP_RIGHT,
        };

        this.panos[EdgeDirection.STEP_BACKWARD] = {
            direction: EdgeDirection.STEP_BACKWARD,
            directionChange: Math.PI,
            next: EdgeDirection.STEP_RIGHT,
            prev: EdgeDirection.STEP_LEFT,
        };

        this.panos[EdgeDirection.STEP_LEFT] = {
            direction: EdgeDirection.STEP_LEFT,
            directionChange: Math.PI / 2,
            next: EdgeDirection.STEP_BACKWARD,
            prev: EdgeDirection.STEP_FORWARD,
        };

        this.panos[EdgeDirection.STEP_RIGHT] = {
            direction: EdgeDirection.STEP_RIGHT,
            directionChange: -Math.PI / 2,
            next: EdgeDirection.STEP_FORWARD,
            prev: EdgeDirection.STEP_BACKWARD,
        };

        this.rotations[EdgeDirection.ROTATE_LEFT] = {
            direction: EdgeDirection.ROTATE_LEFT,
            directionChangeSign: 1,
        };

        this.rotations[EdgeDirection.ROTATE_RIGHT] = {
            direction: EdgeDirection.ROTATE_RIGHT,
            directionChangeSign: -1,
        };
    }
}
