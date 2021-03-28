import * as THREE from "three";

import { StateBase } from "./StateBase";

import { EulerRotationDelta } from "./EulerRotationDelta";
import { EulerRotation } from "../interfaces/EulerRotation";
import { IStateBase } from "../interfaces/IStateBase";
import { Camera } from "../../geo/Camera";
import { Transform } from "../../geo/Transform";
import { Image } from "../../graph/Image";
import { isSpherical } from "../../geo/Geo";

export abstract class InteractiveStateBase extends StateBase {
    /**
     * Animation speed in transitions per frame at 60 FPS. Run time
     * animation speed is adjusted to FPS.
     */
    protected _animationSpeed: number;

    protected _rotationDelta: EulerRotationDelta;
    protected _requestedRotationDelta: EulerRotationDelta;

    protected _basicRotation: number[];
    protected _requestedBasicRotation: number[];
    protected _requestedBasicRotationUnbounded: number[];

    protected _rotationAcceleration: number;
    protected _rotationIncreaseAlpha: number;
    protected _rotationDecreaseAlpha: number;
    protected _rotationThreshold: number;
    protected _unboundedRotationAlpha: number;

    protected _desiredZoom: number;
    protected _minZoom: number;
    protected _maxZoom: number;
    protected _lookatDepth: number;
    protected _desiredLookat: THREE.Vector3;
    protected _desiredCenter: number[];

    constructor(state: IStateBase) {
        super(state);

        this._animationSpeed = 1 / 40;

        this._rotationDelta = new EulerRotationDelta(0, 0);
        this._requestedRotationDelta = null;

        this._basicRotation = [0, 0];
        this._requestedBasicRotation = null;
        this._requestedBasicRotationUnbounded = null;

        this._rotationAcceleration = 0.86;
        this._rotationIncreaseAlpha = 0.97;
        this._rotationDecreaseAlpha = 0.9;
        this._rotationThreshold = 1e-3;
        this._unboundedRotationAlpha = 0.8;

        this._desiredZoom = state.zoom;
        this._minZoom = 0;
        this._maxZoom = 3;
        this._lookatDepth = 10;

        this._desiredLookat = null;
        this._desiredCenter = null;
    }

    public rotate(rotationDelta: EulerRotation): void {
        if (this._currentImage == null) {
            return;
        }

        if (rotationDelta.phi === 0 && rotationDelta.theta === 0) {
            return;
        }

        this._desiredZoom = this._zoom;
        this._desiredLookat = null;
        this._requestedBasicRotation = null;

        if (this._requestedRotationDelta != null) {
            this._requestedRotationDelta.phi = this._requestedRotationDelta.phi + rotationDelta.phi;
            this._requestedRotationDelta.theta = this._requestedRotationDelta.theta + rotationDelta.theta;
        } else {
            this._requestedRotationDelta = new EulerRotationDelta(rotationDelta.phi, rotationDelta.theta);
        }
    }

    public rotateUnbounded(delta: EulerRotation): void {
        if (this._currentImage == null) {
            return;
        }

        this._requestedBasicRotation = null;
        this._requestedRotationDelta = null;

        this._applyRotation(delta, this._currentCamera);
        this._applyRotation(delta, this._previousCamera);

        if (!this._desiredLookat) {
            return;
        }

        const q: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(this._currentCamera.up, new THREE.Vector3(0, 0, 1));
        const qInverse: THREE.Quaternion = q.clone().invert();

        const offset: THREE.Vector3 = new THREE.Vector3()
            .copy(this._desiredLookat)
            .sub(this._camera.position)
            .applyQuaternion(q);

        const length: number = offset.length();

        let phi: number = Math.atan2(offset.y, offset.x);
        phi += delta.phi;

        let theta: number = Math.atan2(Math.sqrt(offset.x * offset.x + offset.y * offset.y), offset.z);
        theta += delta.theta;
        theta = Math.max(0.1, Math.min(Math.PI - 0.1, theta));

        offset.x = Math.sin(theta) * Math.cos(phi);
        offset.y = Math.sin(theta) * Math.sin(phi);
        offset.z = Math.cos(theta);

        offset.applyQuaternion(qInverse);

        this._desiredLookat
            .copy(this._camera.position)
            .add(offset.multiplyScalar(length));
    }

    public rotateWithoutInertia(rotationDelta: EulerRotation): void {
        if (this._currentImage == null) {
            return;
        }

        this._desiredZoom = this._zoom;
        this._desiredLookat = null;
        this._requestedBasicRotation = null;
        this._requestedRotationDelta = null;

        const threshold: number = Math.PI / (10 * Math.pow(2, this._zoom));
        const delta: EulerRotation = {
            phi: this._spatial.clamp(rotationDelta.phi, -threshold, threshold),
            theta: this._spatial.clamp(rotationDelta.theta, -threshold, threshold),
        };

        this._applyRotation(delta, this._currentCamera);
        this._applyRotation(delta, this._previousCamera);
    }

    public rotateBasic(basicRotation: number[]): void {
        if (this._currentImage == null) {
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

    public rotateBasicUnbounded(basicRotation: number[]): void {
        if (this._currentImage == null) {
            return;
        }

        if (this._requestedBasicRotationUnbounded != null) {
            this._requestedBasicRotationUnbounded[0] += basicRotation[0];
            this._requestedBasicRotationUnbounded[1] += basicRotation[1];
        } else {
            this._requestedBasicRotationUnbounded = basicRotation.slice();
        }
    }

    public rotateBasicWithoutInertia(basic: number[]): void {
        if (this._currentImage == null) {
            return;
        }

        this._desiredZoom = this._zoom;
        this._desiredLookat = null;
        this._requestedRotationDelta = null;
        this._requestedBasicRotation = null;

        const threshold: number = 0.05 / Math.pow(2, this._zoom);

        const basicRotation: number[] = basic.slice();
        basicRotation[0] = this._spatial.clamp(basicRotation[0], -threshold, threshold);
        basicRotation[1] = this._spatial.clamp(basicRotation[1], -threshold, threshold);

        this._applyRotationBasic(basicRotation);
    }

    public rotateToBasic(basic: number[]): void {
        if (this._currentImage == null) {
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
        if (this._currentImage == null) {
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

        if (isSpherical(this.currentTransform.cameraType)) {
            if (refX - currentCenterX > 0.5) {
                refX = refX - 1;
            } else if (currentCenterX - refX > 0.5) {
                refX = 1 + refX;
            }
        }

        let newCenterX: number = refX - zoom0 / zoom1 * (refX - currentCenterX);
        let newCenterY: number = refY - zoom0 / zoom1 * (refY - currentCenterY);

        if (isSpherical(this._currentImage.cameraType)) {
            newCenterX = this._spatial
                .wrap(newCenterX + this._basicRotation[0], 0, 1);
            newCenterY = this._spatial
                .clamp(newCenterY + this._basicRotation[1], 0.05, 0.95);
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

        if (this._currentImage == null) {
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

    protected _applyRotation(delta: EulerRotation, camera: Camera): void {
        if (camera == null) {
            return;
        }

        let q: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 0, 1));
        let qInverse: THREE.Quaternion = q.clone().invert();

        let offset: THREE.Vector3 = new THREE.Vector3();
        offset.copy(camera.lookat).sub(camera.position);
        offset.applyQuaternion(q);
        let length: number = offset.length();

        let phi: number = Math.atan2(offset.y, offset.x);
        phi += delta.phi;

        let theta: number = Math.atan2(Math.sqrt(offset.x * offset.x + offset.y * offset.y), offset.z);
        theta += delta.theta;
        theta = Math.max(0.1, Math.min(Math.PI - 0.1, theta));

        offset.x = Math.sin(theta) * Math.cos(phi);
        offset.y = Math.sin(theta) * Math.sin(phi);
        offset.z = Math.cos(theta);
        offset.applyQuaternion(qInverse);

        camera.lookat.copy(camera.position).add(offset.multiplyScalar(length));
    }

    protected _applyRotationBasic(basicRotation: number[]): void {
        let currentImage: Image = this._currentImage;
        let previousImage: Image = this._previousImage != null ?
            this.previousImage :
            this.currentImage;

        let currentCamera: Camera = this._currentCamera;
        let previousCamera: Camera = this._previousCamera;

        let currentTransform: Transform = this.currentTransform;
        let previousTransform: Transform = this.previousTransform != null ?
            this.previousTransform :
            this.currentTransform;

        let currentBasic: number[] = currentTransform.projectBasic(currentCamera.lookat.toArray());
        let previousBasic: number[] = previousTransform.projectBasic(previousCamera.lookat.toArray());

        if (isSpherical(currentImage.cameraType)) {
            currentBasic[0] = this._spatial.wrap(currentBasic[0] + basicRotation[0], 0, 1);
            currentBasic[1] = this._spatial.clamp(currentBasic[1] + basicRotation[1], 0.05, 0.95);
        } else {
            currentBasic[0] = this._spatial.clamp(currentBasic[0] + basicRotation[0], 0, 1);
            currentBasic[1] = this._spatial.clamp(currentBasic[1] + basicRotation[1], 0, 1);
        }

        if (isSpherical(previousImage.cameraType)) {
            previousBasic[0] = this._spatial.wrap(previousBasic[0] + basicRotation[0], 0, 1);
            previousBasic[1] = this._spatial.clamp(previousBasic[1] + basicRotation[1], 0.05, 0.95);
        } else {
            previousBasic[0] = this._spatial.clamp(previousBasic[0] + basicRotation[0], 0, 1);
            previousBasic[1] = this._spatial.clamp(currentBasic[1] + basicRotation[1], 0, 1);
        }

        let currentLookat: number[] = currentTransform.unprojectBasic(currentBasic, this._lookatDepth);
        currentCamera.lookat.fromArray(currentLookat);

        let previousLookat: number[] = previousTransform.unprojectBasic(previousBasic, this._lookatDepth);
        previousCamera.lookat.fromArray(previousLookat);
    }

    protected _updateZoom(animationSpeed: number): void {
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

    protected _updateLookat(animationSpeed: number): void {
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

    protected _updateRotation(): void {
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

        const alpha: number = isSpherical(this.currentImage.cameraType) ?
            1 : this._alpha;

        this._rotationDelta.multiply(this._rotationAcceleration * alpha);
        this._rotationDelta.threshold(this._rotationThreshold);
    }

    protected _updateRotationBasic(): void {
        if (this._requestedBasicRotation != null) {
            let x: number = this._basicRotation[0];
            let y: number = this._basicRotation[1];

            let reqX: number = this._requestedBasicRotation[0];
            let reqY: number = this._requestedBasicRotation[1];

            if (Math.abs(reqX) > Math.abs(x)) {
                this._basicRotation[0] = (1 - this._rotationIncreaseAlpha) * x + this._rotationIncreaseAlpha * reqX;
            } else {
                this._basicRotation[0] = (1 - this._rotationDecreaseAlpha) * x + this._rotationDecreaseAlpha * reqX;
            }

            if (Math.abs(reqY) > Math.abs(y)) {
                this._basicRotation[1] = (1 - this._rotationIncreaseAlpha) * y + this._rotationIncreaseAlpha * reqY;
            } else {
                this._basicRotation[1] = (1 - this._rotationDecreaseAlpha) * y + this._rotationDecreaseAlpha * reqY;
            }

            this._requestedBasicRotation = null;

            return;
        }

        if (this._requestedBasicRotationUnbounded != null) {
            let reqX: number = this._requestedBasicRotationUnbounded[0];
            let reqY: number = this._requestedBasicRotationUnbounded[1];

            if (Math.abs(reqX) > 0) {
                this._basicRotation[0] = (1 - this._unboundedRotationAlpha) * this._basicRotation[0] + this._unboundedRotationAlpha * reqX;
            }

            if (Math.abs(reqY) > 0) {
                this._basicRotation[1] = (1 - this._unboundedRotationAlpha) * this._basicRotation[1] + this._unboundedRotationAlpha * reqY;
            }

            if (this._desiredLookat != null) {
                let desiredBasicLookat: number[] = this.currentTransform.projectBasic(this._desiredLookat.toArray());

                desiredBasicLookat[0] += reqX;
                desiredBasicLookat[1] += reqY;

                this._desiredLookat = new THREE.Vector3()
                    .fromArray(this.currentTransform.unprojectBasic(desiredBasicLookat, this._lookatDepth));
            }

            this._requestedBasicRotationUnbounded = null;
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

    protected _clearRotation(): void {
        if (isSpherical(this._currentImage.cameraType)) {
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

    protected _setDesiredCenter(): void {
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

    protected _setDesiredZoom(): void {
        this._desiredZoom =
            isSpherical(this._currentImage.cameraType) ||
                this._previousImage == null ?
                this._zoom : 0;
    }
}
