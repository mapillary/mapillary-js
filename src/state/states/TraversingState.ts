import * as THREE from "three";
import * as UnitBezier from "@mapbox/unitbezier";

import {
    EarthState,
    IState,
    InteractiveStateBase,
    InteractiveWaitingState,
    StateBase,
    WaitingState,
} from "../../State";
import {
    Node,
} from "../../Graph";
import { Camera } from "../../Geo";

export class TraversingState extends InteractiveStateBase {
    private _baseAlpha: number;

    private _speedCoefficient: number;

    private _unitBezier: UnitBezier;
    private _useBezier: boolean;

    constructor (state: IState) {
        super(state);

        this._adjustCameras();

        this._motionless = this._motionlessTransition();

        this._baseAlpha = this._alpha;
        this._speedCoefficient = 1;
        this._unitBezier = new UnitBezier(0.74, 0.67, 0.38, 0.96);
        this._useBezier = false;
    }

    public earth(): StateBase {
        return new EarthState(this);
    }

    public wait(): StateBase {
        return new WaitingState(this);
    }

    public waitInteractively(): StateBase {
        return new InteractiveWaitingState(this);
    }

    public append(nodes: Node[]): void {
        let emptyTrajectory: boolean = this._trajectory.length === 0;

        if (emptyTrajectory) {
            this._resetTransition();
        }

        super.append(nodes);

        if (emptyTrajectory) {
            this._setDesiredCenter();
            this._setDesiredZoom();
        }
    }

    public prepend(nodes: Node[]): void {
        let emptyTrajectory: boolean = this._trajectory.length === 0;

        if (emptyTrajectory) {
            this._resetTransition();
        }

        super.prepend(nodes);

        if (emptyTrajectory) {
            this._setDesiredCenter();
            this._setDesiredZoom();
        }
    }

    public set(nodes: Node[]): void {
        super.set(nodes);

        this._desiredLookat = null;

        this._resetTransition();
        this._clearRotation();

        this._setDesiredCenter();
        this._setDesiredZoom();

        if (this._trajectory.length < 3) {
            this._useBezier = true;
        }
    }

    public setSpeed(speed: number): void {
        this._speedCoefficient = this._spatial.clamp(speed, 0, 10);
    }

    public update(fps: number): void {
        if (this._alpha === 1 && this._currentIndex + this._alpha < this._trajectory.length) {
            this._currentIndex += 1;

            this._useBezier = this._trajectory.length < 3 &&
                this._currentIndex + 1 === this._trajectory.length;

            this._setCurrent();
            this._resetTransition();
            this._clearRotation();

            this._desiredZoom = this._currentNode.fullPano ? this._zoom : 0;

            this._desiredLookat = null;
        }

        let animationSpeed: number = this._animationSpeed * (60 / fps);
        this._baseAlpha = Math.min(1, this._baseAlpha + this._speedCoefficient * animationSpeed);
        if (this._useBezier) {
            this._alpha = this._unitBezier.solve(this._baseAlpha);
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
        this._updateLookat(animationSpeed)

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
        if (this._previousNode == null) {
            return;
        }

        let lookat: THREE.Vector3 = this._camera.lookat.clone().sub(this._camera.position);
        this._previousCamera.lookat.copy(lookat.clone().add(this._previousCamera.position));

        if (this._currentNode.fullPano) {
            this._currentCamera.lookat.copy(lookat.clone().add(this._currentCamera.position));
        }
    }

    private _resetTransition(): void {
        this._alpha = 0;
        this._baseAlpha = 0;

        this._motionless = this._motionlessTransition();
    }
}

export default TraversingState;
