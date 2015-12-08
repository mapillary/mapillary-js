import {GraphConstants} from "../Graph";

export interface IStep {
    direction: GraphConstants.Direction;
    motionChange: number;
    useFallback: boolean;
}

export class EdgeCalculatorDirections {

    private _steps: IStep[];

    constructor() {
        this._steps = [
            {
                direction: GraphConstants.Direction.STEP_FORWARD,
                motionChange: 0,
                useFallback: true
            },
            {
                direction: GraphConstants.Direction.STEP_BACKWARD,
                motionChange: Math.PI,
                useFallback: true
            },
            {
                direction: GraphConstants.Direction.STEP_LEFT,
                motionChange: Math.PI / 2,
                useFallback: false
            },
            {
                direction: GraphConstants.Direction.STEP_RIGHT,
                motionChange: -Math.PI / 2,
                useFallback: false
            }
        ];
    }

    public get steps(): IStep[] {
        return this._steps;
    }
}
