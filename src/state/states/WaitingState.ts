import {IState, StateBase, IRotation, TraversingState} from "../../State";

export class WaitingState extends StateBase {
    constructor(state: IState) {
        super(state);
    }

    public traverse(): StateBase {
        return new TraversingState(this);
    }

    public wait(): StateBase {
        throw new Error("Not implemented");
    }

    public rotate(delta: IRotation): void { return; };

    public move(delta: number): void {
        this._alpha = Math.max(0, Math.min(1, this._alpha + delta));
    }

    public moveTo(position: number): void {
        this._alpha = Math.max(0, Math.min(1, position));
    }

    public update(): void {
        this._camera.lerpCameras(this._previousCamera, this._currentCamera, this.alpha);
    }

    protected _getAlpha(): number { return this._alpha; };
}
