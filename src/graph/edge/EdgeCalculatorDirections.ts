import {EdgeConstants, IStep, ITurn, IPano, IRotation} from "../../Edge";

export class EdgeCalculatorDirections {

    public steps: { [direction: string]: IStep } = {};
    public turns: { [direction: string]: ITurn } = {};
    public panos: { [direction: string]: IPano } = {};
    public rotations: { [direction: string]: IRotation } = {};

    constructor() {
        this.steps[EdgeConstants.EdgeDirection.STEP_FORWARD] = {
            direction: EdgeConstants.EdgeDirection.STEP_FORWARD,
            motionChange: 0,
            useFallback: true,
        };

        this.steps[EdgeConstants.EdgeDirection.STEP_BACKWARD] = {
            direction: EdgeConstants.EdgeDirection.STEP_BACKWARD,
            motionChange: Math.PI,
            useFallback: true,
        };

        this.steps[EdgeConstants.EdgeDirection.STEP_LEFT] = {
            direction: EdgeConstants.EdgeDirection.STEP_LEFT,
            motionChange: Math.PI / 2,
            useFallback: false,
        };

        this.steps[EdgeConstants.EdgeDirection.STEP_RIGHT] = {
            direction: EdgeConstants.EdgeDirection.STEP_RIGHT,
            motionChange: -Math.PI / 2,
            useFallback: false,
        };

        this.turns[EdgeConstants.EdgeDirection.TURN_LEFT] = {
            direction: EdgeConstants.EdgeDirection.TURN_LEFT,
            directionChange: Math.PI / 2,
            motionChange: Math.PI / 4,
        };

        this.turns[EdgeConstants.EdgeDirection.TURN_RIGHT] = {
            direction: EdgeConstants.EdgeDirection.TURN_RIGHT,
            directionChange: -Math.PI / 2,
            motionChange: -Math.PI / 4,
        };

        this.turns[EdgeConstants.EdgeDirection.TURN_U] = {
            direction: EdgeConstants.EdgeDirection.TURN_U,
            directionChange: Math.PI,
            motionChange: null,
        };

        this.panos[EdgeConstants.EdgeDirection.STEP_FORWARD] = {
            direction: EdgeConstants.EdgeDirection.STEP_FORWARD,
            directionChange: 0,
            next: EdgeConstants.EdgeDirection.STEP_LEFT,
            prev: EdgeConstants.EdgeDirection.STEP_RIGHT,
        };

        this.panos[EdgeConstants.EdgeDirection.STEP_BACKWARD] = {
            direction: EdgeConstants.EdgeDirection.STEP_BACKWARD,
            directionChange: Math.PI,
            next: EdgeConstants.EdgeDirection.STEP_RIGHT,
            prev: EdgeConstants.EdgeDirection.STEP_LEFT,
        };

        this.panos[EdgeConstants.EdgeDirection.STEP_LEFT] = {
            direction: EdgeConstants.EdgeDirection.STEP_LEFT,
            directionChange: Math.PI / 2,
            next: EdgeConstants.EdgeDirection.STEP_BACKWARD,
            prev: EdgeConstants.EdgeDirection.STEP_FORWARD,
        };

        this.panos[EdgeConstants.EdgeDirection.STEP_RIGHT] = {
            direction: EdgeConstants.EdgeDirection.STEP_RIGHT,
            directionChange: -Math.PI / 2,
            next: EdgeConstants.EdgeDirection.STEP_FORWARD,
            prev: EdgeConstants.EdgeDirection.STEP_BACKWARD,
        };

        this.rotations[EdgeConstants.EdgeDirection.ROTATE_LEFT] = {
            direction: EdgeConstants.EdgeDirection.ROTATE_LEFT,
            directionChangeSign: 1,
        };

        this.rotations[EdgeConstants.EdgeDirection.ROTATE_RIGHT] = {
            direction: EdgeConstants.EdgeDirection.ROTATE_RIGHT,
            directionChangeSign: -1,
        };
    }
}
