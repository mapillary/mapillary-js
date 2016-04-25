import {Node} from "../../Graph";
import {IState, StateBase, IRotation, TraversingState} from "../../State";

export class WaitingState extends StateBase {
    constructor(state: IState) {
        super(state);

        this._motionless = this._motionlessTransition();
    }

    public traverse(): StateBase {
        return new TraversingState(this);
    }

    public wait(): StateBase {
        throw new Error("Not implemented");
    }

    public prepend(nodes: Node[]): void {
        super.prepend(nodes);

        this._motionless = this._motionlessTransition();
    }

    public set(nodes: Node[]): void {
        super.set(nodes);

        this._motionless = this._motionlessTransition();
    }

    public rotate(delta: IRotation): void { return; }

    public zoomIn(delta: number): void { return; }

    public move(delta: number): void {
        this._alpha = Math.max(0, Math.min(1, this._alpha + delta));
    }

    public moveTo(position: number): void {
        this._alpha = Math.max(0, Math.min(1, position));
    }

    public update(fps: number): void {
        this._camera.lerpCameras(this._previousCamera, this._currentCamera, this.alpha);
    }

    protected _getAlpha(): number {
        return this._motionless ? Math.ceil(this._alpha) : this._alpha;
    };
}
