import {EdgeConstants} from "../Edge";

export interface IStep {
    direction: EdgeConstants.Direction;
    motionChange: number;
    useFallback: boolean;
}

export class EdgeCalculatorDirections {

    private _steps: IStep[];

    constructor() {
        this._steps = [
            {
                direction: EdgeConstants.Direction.STEP_FORWARD,
                motionChange: 0,
                useFallback: true
            },
            {
                direction: EdgeConstants.Direction.STEP_BACKWARD,
                motionChange: Math.PI,
                useFallback: true
            },
            {
                direction: EdgeConstants.Direction.STEP_LEFT,
                motionChange: Math.PI / 2,
                useFallback: false
            },
            {
                direction: EdgeConstants.Direction.STEP_RIGHT,
                motionChange: -Math.PI / 2,
                useFallback: false
            }
        ];
    }

    public get steps(): IStep[] {
        return this._steps;
    }
}
