import {Node} from "../../Graph";
import {IState, StateBase, IRotation, TraversingState} from "../../State";

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

    public rotateBasic(basicRotation: number[]): void { return; }

    public rotateBasicUnbounded(basicRotation: number[]): void { return; }

    public rotateBasicWithoutInertia(basicRotation: number[]): void { return; }

    public rotateToBasic(basic: number[]): void { return; }

    public setSpeed(speed: number): void { return; }

    public zoomIn(delta: number, reference: number[]): void { return; }

    public move(delta: number): void {
        this._alpha = Math.max(0, Math.min(1, this._alpha + delta));
    }

    public moveTo(position: number): void {
        this._alpha = Math.max(0, Math.min(1, position));
    }

    public update(fps: number): void {
        this._camera.lerpCameras(this._previousCamera, this._currentCamera, this.alpha);
    }

    public setCenter(center: number[]): void { return; }

    public setZoom(zoom: number): void { return; }

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
