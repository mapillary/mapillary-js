import {
    EdgeDirection,
    IPano,
    IStep,
    ITurn,
} from "../../Edge";

export class EdgeCalculatorDirections {

    public steps: { [direction: string]: IStep } = {};
    public turns: { [direction: string]: ITurn } = {};
    public panos: { [direction: string]: IPano } = {};

    constructor() {
        this.steps[EdgeDirection.StepForward] = {
            direction: EdgeDirection.StepForward,
            motionChange: 0,
            useFallback: true,
        };

        this.steps[EdgeDirection.StepBackward] = {
            direction: EdgeDirection.StepBackward,
            motionChange: Math.PI,
            useFallback: true,
        };

        this.steps[EdgeDirection.StepLeft] = {
            direction: EdgeDirection.StepLeft,
            motionChange: Math.PI / 2,
            useFallback: false,
        };

        this.steps[EdgeDirection.StepRight] = {
            direction: EdgeDirection.StepRight,
            motionChange: -Math.PI / 2,
            useFallback: false,
        };

        this.turns[EdgeDirection.TurnLeft] = {
            direction: EdgeDirection.TurnLeft,
            directionChange: Math.PI / 2,
            motionChange: Math.PI / 4,
        };

        this.turns[EdgeDirection.TurnRight] = {
            direction: EdgeDirection.TurnRight,
            directionChange: -Math.PI / 2,
            motionChange: -Math.PI / 4,
        };

        this.turns[EdgeDirection.TurnU] = {
            direction: EdgeDirection.TurnU,
            directionChange: Math.PI,
            motionChange: null,
        };

        this.panos[EdgeDirection.StepForward] = {
            direction: EdgeDirection.StepForward,
            directionChange: 0,
            next: EdgeDirection.StepLeft,
            prev: EdgeDirection.StepRight,
        };

        this.panos[EdgeDirection.StepBackward] = {
            direction: EdgeDirection.StepBackward,
            directionChange: Math.PI,
            next: EdgeDirection.StepRight,
            prev: EdgeDirection.StepLeft,
        };

        this.panos[EdgeDirection.StepLeft] = {
            direction: EdgeDirection.StepLeft,
            directionChange: Math.PI / 2,
            next: EdgeDirection.StepBackward,
            prev: EdgeDirection.StepForward,
        };

        this.panos[EdgeDirection.StepRight] = {
            direction: EdgeDirection.StepRight,
            directionChange: -Math.PI / 2,
            next: EdgeDirection.StepForward,
            prev: EdgeDirection.StepBackward,
        };
    }
}
