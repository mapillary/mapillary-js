import { NavigationDirection } from "./NavigationDirection";
import { SphericalDirection } from "./interfaces/SphericalDirection";
import { StepDirection } from "./interfaces/StepDirection";
import { TurnDirection } from "./interfaces/TurnDirection";

export class EdgeCalculatorDirections {

    public steps: { [direction: string]: StepDirection } = {};
    public turns: { [direction: string]: TurnDirection } = {};
    public spherical: { [direction: string]: SphericalDirection } = {};

    constructor() {
        this.steps[NavigationDirection.StepForward] = {
            direction: NavigationDirection.StepForward,
            motionChange: 0,
            useFallback: true,
        };

        this.steps[NavigationDirection.StepBackward] = {
            direction: NavigationDirection.StepBackward,
            motionChange: Math.PI,
            useFallback: true,
        };

        this.steps[NavigationDirection.StepLeft] = {
            direction: NavigationDirection.StepLeft,
            motionChange: Math.PI / 2,
            useFallback: false,
        };

        this.steps[NavigationDirection.StepRight] = {
            direction: NavigationDirection.StepRight,
            motionChange: -Math.PI / 2,
            useFallback: false,
        };

        this.turns[NavigationDirection.TurnLeft] = {
            direction: NavigationDirection.TurnLeft,
            directionChange: Math.PI / 2,
            motionChange: Math.PI / 4,
        };

        this.turns[NavigationDirection.TurnRight] = {
            direction: NavigationDirection.TurnRight,
            directionChange: -Math.PI / 2,
            motionChange: -Math.PI / 4,
        };

        this.turns[NavigationDirection.TurnU] = {
            direction: NavigationDirection.TurnU,
            directionChange: Math.PI,
            motionChange: null,
        };

        this.spherical[NavigationDirection.StepForward] = {
            direction: NavigationDirection.StepForward,
            directionChange: 0,
            next: NavigationDirection.StepLeft,
            prev: NavigationDirection.StepRight,
        };

        this.spherical[NavigationDirection.StepBackward] = {
            direction: NavigationDirection.StepBackward,
            directionChange: Math.PI,
            next: NavigationDirection.StepRight,
            prev: NavigationDirection.StepLeft,
        };

        this.spherical[NavigationDirection.StepLeft] = {
            direction: NavigationDirection.StepLeft,
            directionChange: Math.PI / 2,
            next: NavigationDirection.StepBackward,
            prev: NavigationDirection.StepForward,
        };

        this.spherical[NavigationDirection.StepRight] = {
            direction: NavigationDirection.StepRight,
            directionChange: -Math.PI / 2,
            next: NavigationDirection.StepForward,
            prev: NavigationDirection.StepBackward,
        };
    }
}
