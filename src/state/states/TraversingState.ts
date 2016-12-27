/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";
import * as UnitBezier from "unitbezier";

import {IGPano} from "../../API";
import {IState, StateBase, IRotation, WaitingState} from "../../State";
import {Node} from "../../Graph";
import {Camera, Transform} from "../../Geo";

class RotationDelta implements IRotation {
    private _phi: number;
    private _theta: number;

    constructor(phi: number, theta: number) {
        this._phi = phi;
        this._theta = theta;
    }

    public get phi(): number {
        return this._phi;
    }

    public set phi(value: number) {
        this._phi = value;
    }

    public get theta(): number {
        return this._theta;
    }

    public set theta(value: number) {
        this._theta = value;
    }

    public get isZero(): boolean {
        return this._phi === 0 && this._theta === 0;
    }

    public copy(delta: IRotation): void {
        this._phi = delta.phi;
        this._theta = delta.theta;
    }

    public lerp(other: IRotation, alpha: number): void {
        this._phi =  (1 - alpha) * this._phi + alpha * other.phi;
        this._theta =  (1 - alpha) * this._theta + alpha * other.theta;
    }

    public multiply(value: number): void {
        this._phi *= value;
        this._theta *= value;
    }

    public threshold(value: number): void {
        this._phi = Math.abs(this._phi) > value ? this._phi : 0;
        this._theta = Math.abs(this._theta) > value ? this._theta : 0;
    }

    public lengthSquared(): number {
        return this._phi * this._phi + this._theta * this._theta;
    }

    public reset(): void {
        this._phi = 0;
        this._theta = 0;
    }
}

export class TraversingState extends StateBase {
    private _baseAlpha: number;
    private _animationSpeed: number;

    private _unitBezier: UnitBezier;
    private _useBezier: boolean;

    private _rotationDelta: RotationDelta;
    private _requestedRotationDelta: RotationDelta;

    private _basicRotation: number[];
    private _requestedBasicRotation: number[];

    private _rotationAcceleration: number;
    private _rotationIncreaseAlpha: number;
    private _rotationDecreaseAlpha: number;
    private _rotationThreshold: number;

    private _desiredZoom: number;
    private _minZoom: number;
    private _maxZoom: number;
    private _lookatDepth: number;
    private _desiredLookat: THREE.Vector3;
    private _desiredCenter: number[];

    constructor (state: IState) {
        super(state);

        this._adjustCameras();

        this._motionless = this._motionlessTransition();

        this._baseAlpha = this._alpha;
        this._animationSpeed = 0.025;
        this._unitBezier = new UnitBezier(0.74, 0.67, 0.38, 0.96);
        this._useBezier = false;

        this._rotationDelta = new RotationDelta(0, 0);
        this._requestedRotationDelta = null;

        this._basicRotation = [0, 0];
        this._requestedBasicRotation = null;

        this._rotationAcceleration = 0.86;
        this._rotationIncreaseAlpha = 0.97;
        this._rotationDecreaseAlpha = 0.9;
        this._rotationThreshold = 0.001;

        this._desiredZoom = state.zoom;
        this._minZoom = 0;
        this._maxZoom = 3;
        this._lookatDepth = 10;

        this._desiredLookat = null;
        this._desiredCenter = null;
    }

    public traverse(): StateBase {
        throw new Error("Not implemented");
    }

    public wait(): StateBase {
        return new WaitingState(this);
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

    public move(delta: number): void {
        throw new Error("Not implemented");
    }

    public moveTo(delta: number): void {
        throw new Error("Not implemented");
    }

    public rotate(rotationDelta: IRotation): void {
        if (this._currentNode == null) {
            return;
        }

        this._desiredZoom = this._zoom;
        this._desiredLookat = null;
        this._requestedBasicRotation = null;

        if (this._requestedRotationDelta != null) {
            this._requestedRotationDelta.phi = this._requestedRotationDelta.phi + rotationDelta.phi;
            this._requestedRotationDelta.theta = this._requestedRotationDelta.theta + rotationDelta.theta;
        } else {
            this._requestedRotationDelta = new RotationDelta(rotationDelta.phi, rotationDelta.theta);
        }
    }

    public rotateBasic(basicRotation: number[]): void {
        if (this._currentNode == null) {
            return;
        }

        this._desiredZoom = this._zoom;
        this._desiredLookat = null;
        this._requestedRotationDelta = null;

        if (this._requestedBasicRotation != null) {
            this._requestedBasicRotation[0] += basicRotation[0];
            this._requestedBasicRotation[1] += basicRotation[1];

            let threshold: number = 0.05 / Math.pow(2, this._zoom);

            this._requestedBasicRotation[0] =
                this._spatial.clamp(this._requestedBasicRotation[0], -threshold, threshold);

            this._requestedBasicRotation[1] =
                this._spatial.clamp(this._requestedBasicRotation[1], -threshold, threshold);
        } else {
            this._requestedBasicRotation = basicRotation.slice();
        }
    }

    public rotateToBasic(basic: number[]): void {
        if (this._currentNode == null) {
            return;
        }

        this._desiredZoom = this._zoom;
        this._desiredLookat = null;

        basic[0] = this._spatial.clamp(basic[0], 0, 1);
        basic[1] = this._spatial.clamp(basic[1], 0, 1);

        let lookat: number[] = this.currentTransform.unprojectBasic(basic, this._lookatDepth);
        this._currentCamera.lookat.fromArray(lookat);
    }

    public zoomIn(delta: number, reference: number[]): void {
        if (this._currentNode == null) {
            return;
        }

        this._desiredZoom = Math.max(this._minZoom, Math.min(this._maxZoom, this._desiredZoom + delta));

        let currentCenter: number[] = this.currentTransform.projectBasic(
            this._currentCamera.lookat.toArray());

        let currentCenterX: number = currentCenter[0];
        let currentCenterY: number = currentCenter[1];

        let zoom0: number = Math.pow(2, this._zoom);
        let zoom1: number = Math.pow(2, this._desiredZoom);

        let refX: number = reference[0];
        let refY: number = reference[1];

        if (this.currentTransform.gpano != null &&
            this.currentTransform.gpano.CroppedAreaImageWidthPixels === this.currentTransform.gpano.FullPanoWidthPixels) {
            if (refX - currentCenterX > 0.5) {
                refX = refX - 1;
            } else if (currentCenterX - refX > 0.5) {
                refX = 1 + refX;
            }
        }

        let newCenterX: number = refX - zoom0 / zoom1 * (refX - currentCenterX);
        let newCenterY: number = refY - zoom0 / zoom1 * (refY - currentCenterY);

        let gpano: IGPano = this.currentTransform.gpano;

        if (this._currentNode.fullPano) {
            newCenterX = this._spatial.wrap(newCenterX + this._basicRotation[0], 0, 1);
            newCenterY = this._spatial.clamp(newCenterY + this._basicRotation[1], 0.05, 0.95);
        } else if (gpano != null &&
            this.currentTransform.gpano.CroppedAreaImageWidthPixels === this.currentTransform.gpano.FullPanoWidthPixels) {
            newCenterX = this._spatial.wrap(newCenterX + this._basicRotation[0], 0, 1);
            newCenterY = this._spatial.clamp(newCenterY + this._basicRotation[1], 0, 1);
        } else {
            newCenterX = this._spatial.clamp(newCenterX, 0, 1);
            newCenterY = this._spatial.clamp(newCenterY, 0, 1);
        }

        this._desiredLookat = new THREE.Vector3()
            .fromArray(this.currentTransform.unprojectBasic([newCenterX, newCenterY], this._lookatDepth));
    }

    public setCenter(center: number[]): void {
        this._desiredLookat = null;
        this._requestedRotationDelta = null;
        this._requestedBasicRotation = null;
        this._desiredZoom = this._zoom;

        let clamped: number[] = [
            this._spatial.clamp(center[0], 0, 1),
            this._spatial.clamp(center[1], 0, 1),
        ];

        if (this._currentNode == null) {
            this._desiredCenter = clamped;
            return;
        }

        this._desiredCenter = null;

        let currentLookat: THREE.Vector3 = new THREE.Vector3()
            .fromArray(this.currentTransform.unprojectBasic(clamped, this._lookatDepth));

        let previousTransform: Transform = this.previousTransform != null ?
            this.previousTransform :
            this.currentTransform;
        let previousLookat: THREE.Vector3 = new THREE.Vector3()
            .fromArray(previousTransform.unprojectBasic(clamped, this._lookatDepth));

        this._currentCamera.lookat.copy(currentLookat);
        this._previousCamera.lookat.copy(previousLookat);
    }

    public setZoom(zoom: number): void {
        this._desiredLookat = null;
        this._requestedRotationDelta = null;
        this._requestedBasicRotation = null;

        this._zoom = this._spatial.clamp(zoom, this._minZoom, this._maxZoom);
        this._desiredZoom = this._zoom;
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
        this._baseAlpha = Math.min(1, this._baseAlpha + animationSpeed);
        if (this._useBezier) {
            this._alpha = this._unitBezier.solve(this._baseAlpha);
        } else {
            this._alpha = this._baseAlpha;
        }

        this._updateRotation();
        if (!this._rotationDelta.isZero) {
            this._applyRotation(this._previousCamera);
            this._applyRotation(this._currentCamera);
        }

        this._updateRotationBasic();
        if (this._basicRotation[0] !== 0 || this._basicRotation[1] !== 0) {
            this._applyRotationBasic();
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

    private _applyRotation(camera: Camera): void {
        if (camera == null) {
            return;
        }

        let q: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3( 0, 0, 1 ));
        let qInverse: THREE.Quaternion = q.clone().inverse();

        let offset: THREE.Vector3 = new THREE.Vector3();
        offset.copy(camera.lookat).sub(camera.position);
        offset.applyQuaternion(q);
        let length: number = offset.length();

        let phi: number = Math.atan2(offset.y, offset.x);
        phi += this._rotationDelta.phi;

        let theta: number = Math.atan2(Math.sqrt(offset.x * offset.x + offset.y * offset.y), offset.z);
        theta += this._rotationDelta.theta;
        theta = Math.max(0.1, Math.min(Math.PI - 0.1, theta));

        offset.x = Math.sin(theta) * Math.cos(phi);
        offset.y = Math.sin(theta) * Math.sin(phi);
        offset.z = Math.cos(theta);
        offset.applyQuaternion(qInverse);

        camera.lookat.copy(camera.position).add(offset.multiplyScalar(length));
    }

    private _applyRotationBasic(): void {
        let currentNode: Node = this._currentNode;
        let previousNode: Node = this._previousNode != null ?
            this.previousNode :
            this.currentNode;

        let currentCamera: Camera = this._currentCamera;
        let previousCamera: Camera = this._previousCamera;

        let currentTransform: Transform = this.currentTransform;
        let previousTransform: Transform = this.previousTransform != null ?
            this.previousTransform :
            this.currentTransform;

        let currentBasic: number[] = currentTransform.projectBasic(currentCamera.lookat.toArray());
        let previousBasic: number[] = previousTransform.projectBasic(previousCamera.lookat.toArray());

        let currentGPano: IGPano = currentTransform.gpano;
        let previousGPano: IGPano = previousTransform.gpano;

        if (currentNode.fullPano) {
            currentBasic[0] = this._spatial.wrap(currentBasic[0] + this._basicRotation[0], 0, 1);
            currentBasic[1] = this._spatial.clamp(currentBasic[1] + this._basicRotation[1], 0.05, 0.95);
        } else if (currentGPano != null &&
            currentTransform.gpano.CroppedAreaImageWidthPixels === currentTransform.gpano.FullPanoWidthPixels) {
            currentBasic[0] = this._spatial.wrap(currentBasic[0] + this._basicRotation[0], 0, 1);
            currentBasic[1] = this._spatial.clamp(currentBasic[1] + this._basicRotation[1], 0, 1);
        } else {
            currentBasic[0] = this._spatial.clamp(currentBasic[0] + this._basicRotation[0], 0, 1);
            currentBasic[1] = this._spatial.clamp(currentBasic[1] + this._basicRotation[1], 0, 1);
        }

        if (previousNode.fullPano) {
            previousBasic[0] = this._spatial.wrap(previousBasic[0] + this._basicRotation[0], 0, 1);
            previousBasic[1] = this._spatial.clamp(previousBasic[1] + this._basicRotation[1], 0.05, 0.95);
        } else if (previousGPano != null &&
            previousTransform.gpano.CroppedAreaImageWidthPixels === previousTransform.gpano.FullPanoWidthPixels) {
            previousBasic[0] = this._spatial.wrap(previousBasic[0] + this._basicRotation[0], 0, 1);
            previousBasic[1] = this._spatial.clamp(previousBasic[1] + this._basicRotation[1], 0, 1);
        } else {
            previousBasic[0] = this._spatial.clamp(previousBasic[0] + this._basicRotation[0], 0, 1);
            previousBasic[1] = this._spatial.clamp(currentBasic[1] + this._basicRotation[1], 0, 1);
        }

        let currentLookat: number[] = currentTransform.unprojectBasic(currentBasic, this._lookatDepth);
        currentCamera.lookat.fromArray(currentLookat);

        let previousLookat: number[] = previousTransform.unprojectBasic(previousBasic, this._lookatDepth);
        previousCamera.lookat.fromArray(previousLookat);
    }

    private _updateZoom(animationSpeed: number): void {
        let diff: number = this._desiredZoom - this._zoom;
        let sign: number = diff > 0 ? 1 : diff < 0 ? -1 : 0;

        if (diff === 0) {
            return;
        } else if (Math.abs(diff) < 2e-3) {
            this._zoom = this._desiredZoom;
            if (this._desiredLookat != null) {
                this._desiredLookat = null;
            }
        } else {
            this._zoom += sign * Math.max(Math.abs(5 * animationSpeed * diff), 2e-3);
        }
    }

    private _updateLookat(animationSpeed: number): void {
        if (this._desiredLookat === null) {
            return;
        }

        let diff: number = this._desiredLookat.distanceToSquared(this._currentCamera.lookat);

        if (Math.abs(diff) < 1e-6) {
            this._currentCamera.lookat.copy(this._desiredLookat);
            this._desiredLookat = null;
        } else {
            this._currentCamera.lookat.lerp(this._desiredLookat, 5 * animationSpeed);
        }
    }

    private _updateRotation(): void {
        if (this._requestedRotationDelta != null) {
            let length: number = this._rotationDelta.lengthSquared();
            let requestedLength: number = this._requestedRotationDelta.lengthSquared();

            if (requestedLength > length) {
                this._rotationDelta.lerp(this._requestedRotationDelta, this._rotationIncreaseAlpha);
            } else {
                this._rotationDelta.lerp(this._requestedRotationDelta, this._rotationDecreaseAlpha);
            }

            this._requestedRotationDelta = null;

            return;
        }

        if (this._rotationDelta.isZero) {
            return;
        }

        this._rotationDelta.multiply(this._rotationAcceleration);
        this._rotationDelta.threshold(this._rotationThreshold);
    }

    private _updateRotationBasic(): void {
        if (this._requestedBasicRotation != null) {
            let x: number = this._basicRotation[0];
            let y: number = this._basicRotation[1];
            let lengthSquared: number = x * x + y * y;

            let reqX: number = this._requestedBasicRotation[0];
            let reqY: number = this._requestedBasicRotation[1];
            let reqLengthSquared: number = reqX * reqX + reqY * reqY;

            if (reqLengthSquared > lengthSquared) {
                this._basicRotation[0] = (1 - this._rotationIncreaseAlpha) * x + this._rotationIncreaseAlpha * reqX;
                this._basicRotation[1] = (1 - this._rotationIncreaseAlpha) * y + this._rotationIncreaseAlpha * reqY;
            } else {
                this._basicRotation[0] = (1 - this._rotationDecreaseAlpha) * x + this._rotationDecreaseAlpha * reqX;
                this._basicRotation[1] = (1 - this._rotationDecreaseAlpha) * y + this._rotationDecreaseAlpha * reqY;
            }

            this._requestedBasicRotation = null;

            return;
        }

        if (this._basicRotation[0] === 0 && this._basicRotation[1] === 0) {
            return;
        }

        this._basicRotation[0] = this._rotationAcceleration * this._basicRotation[0];
        this._basicRotation[1] = this._rotationAcceleration * this._basicRotation[1];

        if (Math.abs(this._basicRotation[0]) < this._rotationThreshold / Math.pow(2, this._zoom) &&
            Math.abs(this._basicRotation[1]) < this._rotationThreshold / Math.pow(2, this._zoom)) {
            this._basicRotation = [0, 0];
        }
    }

    private _clearRotation(): void {
        if (this._currentNode.fullPano) {
            return;
        }

        if (this._requestedRotationDelta != null) {
            this._requestedRotationDelta = null;
        }

        if (!this._rotationDelta.isZero) {
            this._rotationDelta.reset();
        }

        if (this._requestedBasicRotation != null) {
            this._requestedBasicRotation = null;
        }

        if (this._basicRotation[0] > 0 || this._basicRotation[1] > 0) {
            this._basicRotation = [0, 0];
        }
    }

    private _setDesiredCenter(): void {
        if (this._desiredCenter == null) {
            return;
        }

        let lookatDirection: THREE.Vector3 = new THREE.Vector3()
            .fromArray(this.currentTransform.unprojectBasic(this._desiredCenter, this._lookatDepth))
            .sub(this._currentCamera.position);

        this._currentCamera.lookat.copy(this._currentCamera.position.clone().add(lookatDirection));
        this._previousCamera.lookat.copy(this._previousCamera.position.clone().add(lookatDirection));

        this._desiredCenter = null;
    }

    private _setDesiredZoom(): void {
        this._desiredZoom =
            this._currentNode.fullPano || this._previousNode == null ?
            this._zoom : 0;
    }
}
