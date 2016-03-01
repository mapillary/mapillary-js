import {IState, StateBase, IRotation} from "../../State";
import {Node} from "../../Graph";

export class WaitingState extends StateBase {
    constructor(state: IState) {
        super(state);
    }

    public traverse(): StateBase {
        throw new Error("Not implemented");
    }

    public wait(): StateBase {
        throw new Error("Not implemented");
    }

    public append(nodes: Node[]): void { return; };

    public remove(n: number): void { return; };

    public cut(): void { return; };

    public set(nodes: Node[]): void {
        super._set(nodes);
        super._setCurrent();
    };

    public rotate(delta: IRotation): void { return; };

    public move(delta: number): void { return; };

    public update(): void {
        this._camera.lerpCameras(this._previousCamera, this._currentCamera, this.alpha);
    };

    protected _getAlpha(): number { return this._alpha; };
}
