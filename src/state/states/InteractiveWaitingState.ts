import {
    Node,
} from "../../Graph";
import {
    IState,
    InteractiveStateBase,
    StateBase,
    TraversingState,
    WaitingState,
} from "../../State";

export class InteractiveWaitingState extends InteractiveStateBase {
    constructor(state: IState) {
        super(state);

        this._adjustCameras();

        this._motionless = this._motionlessTransition();
    }

    public traverse(): StateBase {
        return new TraversingState(this);
    }

    public wait(): StateBase {
        return new WaitingState(this);
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
        this._updateRotation();
        if (!this._rotationDelta.isZero) {
            this._applyRotation(this._rotationDelta, this._previousCamera);
            this._applyRotation(this._rotationDelta, this._currentCamera);
        }

        this._updateRotationBasic();
        if (this._basicRotation[0] !== 0 || this._basicRotation[1] !== 0) {
            this._applyRotationBasic(this._basicRotation);
        }

        let animationSpeed: number = this._animationSpeed * (60 / fps);
        this._updateZoom(animationSpeed);
        this._updateLookat(animationSpeed);

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

export default InteractiveWaitingState;
