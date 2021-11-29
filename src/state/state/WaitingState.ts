import { StateBase } from "./StateBase";
import { IStateBase } from "../interfaces/IStateBase";
import { Image } from "../../graph/Image";
import { isSpherical } from "../../geo/Geo";

export class WaitingState extends StateBase {
    constructor(state: IStateBase) {
        super(state);

        this._zoom = 0;

        this._adjustCameras();

        this._motionless = this._motionlessTransition();
    }

    public prepend(images: Image[]): void {
        super.prepend(images);

        this._motionless = this._motionlessTransition();
    }

    public set(images: Image[]): void {
        super.set(images);

        this._motionless = this._motionlessTransition();
    }

    public move(delta: number): void {
        this._alpha = Math.max(0, Math.min(1, this._alpha + delta));
    }

    public moveTo(position: number): void {
        this._alpha = Math.max(0, Math.min(1, position));
    }

    public update(): void {
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
        if (this._previousImage == null) {
            return;
        }

        if (isSpherical(this._currentImage.cameraType)) {
            let lookat: THREE.Vector3 = this._camera.lookat.clone().sub(this._camera.position);
            this._currentCamera.lookat.copy(lookat.clone().add(this._currentCamera.position));
        }

        if (isSpherical(this._previousImage.cameraType)) {
            let lookat: THREE.Vector3 = this._currentCamera.lookat.clone().sub(this._currentCamera.position);
            this._previousCamera.lookat.copy(lookat.clone().add(this._previousCamera.position));
        }
    }
}
