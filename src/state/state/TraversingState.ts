import { MathUtils } from "three";

import { InteractiveStateBase } from "./InteractiveStateBase";
import { IStateBase } from "../interfaces/IStateBase";
import { Image } from "../../graph/Image";
import { isSpherical } from "../../geo/Geo";
import { isNullImageId } from "../../util/Common";
import { hasReconstructionMesh } from "../../util/Mesh";
import { TransitionMode } from "../TransitionMode";

const FALLBACK_TRANSITION_SPEED = 2.5;

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
        this._applyReorientation();

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

            this._desiredZoom = this._zoom;

            this._desiredLookat = null;

            // Orient the new image before it is rendered this frame so a
            // transition without camera motion lands already facing the
            // registered direction instead of flashing the carried view.
            this._applyReorientation();
        }

        let animationSpeed: number = this._animationSpeed * delta / 1e-1 * 6;
        const transitionSpeed = this._motionless && this.transitionMode !== TransitionMode.Instantaneous ?
            FALLBACK_TRANSITION_SPEED : 1;
        this._baseAlpha = Math.min(
            1,
            this._baseAlpha + this._speedCoefficient * animationSpeed * transitionSpeed);
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

        // Fallback transitions cannot safely interpolate camera geometry, but
        // their image alpha can still advance smoothly to produce a dissolve.
        const cameraAlpha = this._motionless ? Math.ceil(this._alpha) : this._alpha;
        this._camera.lerpCameras(this._previousCamera, this._currentCamera, cameraAlpha);
    }

    protected _getAlpha(): number {
        return this._motionless && this.transitionMode === TransitionMode.Instantaneous ?
            Math.ceil(this._alpha) : this._alpha;
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

        if (
            isSpherical(this._currentImage.cameraType) &&
            !isNullImageId(this._previousImage.id)) {
            this._currentCamera.lookat.copy(
                lookat.clone().add(this._currentCamera.position));
        }
    }

    private _resetTransition(): void {
        this._alpha = 0;
        this._baseAlpha = 0;

        this._motionless = this._motionlessTransition();
    }

    private _applyReorientation(): void {
        if (this._currentImage == null) {
            return;
        }
        const reorientation = this._reorientations.get(this._currentImage.id);
        if (reorientation == null ||
            !isSpherical(this._currentImage.cameraType)) {
            return;
        }
        // A forced hint means the reconstruction was rejected. Convert that
        // transition to a fallback cut so the known-bad pose never renders.
        if (reorientation.forceOnReconstruction) {
            this._motionless = true;
        } else if (!this._motionless ||
            hasReconstructionMesh(this._currentImage.mesh)) {
            return;
        }
        this._currentCamera.lookat.fromArray(
            this.currentTransform.unprojectBasic(
                reorientation.basic, this._lookatDepth));
        const previousTransform = this.previousTransform != null ?
            this.previousTransform : this.currentTransform;
        this._previousCamera.lookat.fromArray(
            previousTransform.unprojectBasic(
                reorientation.basic, this._lookatDepth));
    }
}
