import {
    Node,
} from "../../Graph";
import {
    IState,
    StateBase,
    InteractiveWaitingState,
    TraversingState,
} from "../../State";

export class WaitingState extends StateBase {
    constructor(state: IState) {
        super(state);

        this._zoom = 0;

        this._adjustCameras();

        this._motionless = this._motionlessTransition();
    }

    public traverse(): StateBase {
        return new TraversingState(this);
    }

    public waitInteractively(): StateBase {
        return new InteractiveWaitingState(this);
    }

    public prepend(nodes: Node[]): void {
        super.prepend(nodes);

        this._motionless = this._motionlessTransition();
    }

    public set(nodes: Node[]): void {
        super.set(nodes);

        this._motionless = this._motionlessTransition();
    }

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
        return this._motionless ? Math.round(this._alpha) : this._alpha;
    }

    protected _setCurrentCamera(): void {
        super._setCurrentCamera();

        this._adjustCameras();
    }

    private _adjustCameras(): void {
        if (this._previousNode == null) {
            return;
        }

        if (this._currentNode.fullPano) {
            let lookat: THREE.Vector3 = this._camera.lookat.clone().sub(this._camera.position);
            this._currentCamera.lookat.copy(lookat.clone().add(this._currentCamera.position));
        }

        if (this._previousNode.fullPano) {
            let lookat: THREE.Vector3 = this._currentCamera.lookat.clone().sub(this._currentCamera.position);
            this._previousCamera.lookat.copy(lookat.clone().add(this._previousCamera.position));
        }
    }
}

export default WaitingState;
