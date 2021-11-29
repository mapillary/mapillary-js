import { MathUtils } from "three";

import { InteractiveStateBase } from "./InteractiveStateBase";
import { IStateBase } from "../interfaces/IStateBase";
import { Image } from "../../graph/Image";
import { isSpherical } from "../../geo/Geo";

export class TraversingState extends InteractiveStateBase {

    private _baseAlpha: number;

    private _speedCoefficient: number;

    private _smoothing: boolean;

    constructor(state: IStateBase) {
        super(state);

        this._adjustCameras();

        this._motionless = this._motionlessTransition();

        this._baseAlpha = this._alpha;
        this._speedCoefficient = 1;
        this._smoothing = false;
    }

    public append(images: Image[]): void {
        let emptyTrajectory: boolean = this._trajectory.length === 0;

        if (emptyTrajectory) {
            this._resetTransition();
        }

        super.append(images);

        if (emptyTrajectory) {
            this._setDesiredCenter();
            this._setDesiredZoom();
        }
    }

    public prepend(images: Image[]): void {
        let emptyTrajectory: boolean = this._trajectory.length === 0;

        if (emptyTrajectory) {
            this._resetTransition();
        }

        super.prepend(images);

        if (emptyTrajectory) {
            this._setDesiredCenter();
            this._setDesiredZoom();
        }
    }

    public set(images: Image[]): void {
        super.set(images);

        this._desiredLookat = null;

        this._resetTransition();
        this._clearRotation();

        this._setDesiredCenter();
        this._setDesiredZoom();

        if (this._trajectory.length < 3) {
            this._smoothing = true;
        }
    }

    public setSpeed(speed: number): void {
        this._speedCoefficient = this._spatial.clamp(speed, 0, 10);
    }

    public update(delta: number): void {
        if (this._alpha === 1 && this._currentIndex + this._alpha < this._trajectory.length) {
            this._currentIndex += 1;

            this._smoothing = this._trajectory.length < 3 &&
                this._currentIndex + 1 === this._trajectory.length;

            this._setCurrent();
            this._resetTransition();
            this._clearRotation();

            this._desiredZoom =
                isSpherical(this._currentImage.cameraType) ?
                    this._zoom : 0;

            this._desiredLookat = null;
        }

        let animationSpeed: number = this._animationSpeed * delta / 1e-1 * 6;
        this._baseAlpha = Math.min(1, this._baseAlpha + this._speedCoefficient * animationSpeed);
        if (this._smoothing) {
            this._alpha = MathUtils.smootherstep(this._baseAlpha, 0, 1);
        } else {
            this._alpha = this._baseAlpha;
        }

        this._updateRotation();
        if (!this._rotationDelta.isZero) {
            this._applyRotation(this._rotationDelta, this._previousCamera);
            this._applyRotation(this._rotationDelta, this._currentCamera);
        }

        this._updateRotationBasic();
        if (this._basicRotation[0] !== 0 || this._basicRotation[1] !== 0) {
            this._applyRotationBasic(this._basicRotation);
        }

        this._updateZoom(animationSpeed);
        this._updateLookat(animationSpeed);

        this._camera.lerpCameras(this._previousCamera, this._currentCamera, this.alpha);
    }

    protected _getAlpha(): number {
        return this._motionless ? Math.ceil(this._alpha) : this._alpha;
    }

    protected _setCurrentCamera(): void {
        super._setCurrentCamera();

        this._adjustCameras();
    }

    private _adjustCameras(): void {
        if (this._previousImage == null) {
            return;
        }

        let lookat: THREE.Vector3 = this._camera.lookat.clone().sub(this._camera.position);
        this._previousCamera.lookat.copy(lookat.clone().add(this._previousCamera.position));

        if (isSpherical(this._currentImage.cameraType)) {
            this._currentCamera.lookat.copy(lookat.clone().add(this._currentCamera.position));
        }
    }

    private _resetTransition(): void {
        this._alpha = 0;
        this._baseAlpha = 0;

        this._motionless = this._motionlessTransition();
    }
}
