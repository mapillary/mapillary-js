/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as UnitBezier from "unitbezier";

import {ParameterMapillaryError} from "../../Error";
import {StateBase, IRotation} from "../../State";
import {Node} from "../../Graph";
import {Camera, Transform, Spatial} from "../../Geo";

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

    public get theta(): number {
        return this._theta;
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
    private _spatial: Spatial;

    private _baseAlpha: number;
    private _animationSpeed: number;
    private _motionless: boolean;

    private _trajectoryCameras: Camera[];

    private _currentCamera: Camera;
    private _previousCamera: Camera;

    private _unitBezier: UnitBezier;
    private _useBezier: boolean;

    private _rotationDelta: RotationDelta;
    private _requestedRotationDelta: RotationDelta;
    private _rotationAcceleration: number;
    private _rotationIncreaseAlpha: number;
    private _rotationDecreaseAlpha: number;
    private _rotationThreshold: number;

    constructor (trajectory: Node[]) {
        super();

        this._spatial = new Spatial();

        this._alpha = trajectory.length > 0 ? 0 : 1;
        this._baseAlpha = this._alpha;
        this._animationSpeed = 0.025;
        this._unitBezier = new UnitBezier(0.74, 0.67, 0.38, 0.96);
        this._useBezier = true;

        this._camera = new Camera();
        this._motionless = false;

        this._trajectory = trajectory.slice();
        this._trajectoryTransforms = [];
        this._trajectoryCameras = [];
        for (let node of this._trajectory) {
            let transform: Transform = new Transform(node);
            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }

        this._currentIndex = 0;

        this._currentNode = trajectory.length > 0 ? trajectory[this._currentIndex] : null;
        this._previousNode = null;

        this._currentCamera = trajectory.length > 0 ? this._trajectoryCameras[this._currentIndex] : new Camera();
        this._previousCamera = this._currentCamera.clone();

        this._rotationDelta = new RotationDelta(0, 0);
        this._requestedRotationDelta = null;
        this._rotationAcceleration = 0.86;
        this._rotationIncreaseAlpha = 0.25;
        this._rotationDecreaseAlpha = 0.9;
        this._rotationThreshold = 0.001;
    }

    public traverse(): StateBase {
        throw new Error("Not implemented");
    }

    public wait(): StateBase {
        throw new Error("Not implemented");
    }

    public append(trajectory: Node[]): void {
        if (trajectory.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        if (this._trajectory.length === 0) {
            this._currentIndex = 0;

            this._setNodes();
        }

        this._trajectory = this._trajectory.concat(trajectory);
        for (let node of trajectory) {
            if (!node.loaded) {
                throw new ParameterMapillaryError("Node must be loaded when added to trajectory");
            }

            let transform: Transform = new Transform(node);
            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }
    }

    public remove(n: number): void {
        if (n < 0) {
            throw Error("n must be a positive integer");
        }

        let length: number = this._trajectory.length;

        if (length - (this._currentIndex + 1) < n) {
            throw Error("Current node can not be removed");
        }

        for (let i: number = 0; i < n; i++) {
            this._trajectory.pop();
            this._trajectoryTransforms.pop();
            this._trajectoryCameras.pop();
        }
    }

    public cut(): void {
        while (this._trajectory.length - 1 > this._currentIndex) {
            this._trajectory.pop();
            this._trajectoryTransforms.pop();
            this._trajectoryCameras.pop();
        }
    }

    public set(trajectory: Node[]): void {
        if (trajectory.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        this._useBezier = true;

        this._trajectoryTransforms.length = 0;
        this._trajectoryCameras.length = 0;
        if (this._currentNode != null) {
            this._trajectory = [this._currentNode].concat(trajectory);
            this._currentIndex = 1;
        } else {
            this._trajectory = trajectory.slice();
            this._currentIndex = 0;
        }

        for (let node of this._trajectory) {
            if (!node.loaded) {
                throw new ParameterMapillaryError("Node must be loaded when added to trajectory");
            }

            let transform: Transform = new Transform(node);
            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }

        this._setNodes();
        this._clearRotation();
    }

    public move(delta: number): void {
        throw new Error("Not implemented");
    }

    public rotate(rotationDelta: IRotation): void {
        if (this._currentNode == null || !this._currentNode.fullPano) {
            return;
        }

        this._requestedRotationDelta = new RotationDelta(rotationDelta.phi, rotationDelta.theta);
    }

    public update(): void {
        if (this._alpha === 1 && this._currentIndex + this._alpha < this._trajectory.length) {
            this._currentIndex += 1;

            this._useBezier = this._trajectory.length < 3 &&
                this._currentIndex + 1 === this._trajectory.length;

            this._setNodes();
            this._clearRotation();
        }

        this._baseAlpha = Math.min(1, this._baseAlpha + this._animationSpeed);
        if (this._useBezier) {
            this._alpha = this._unitBezier.solve(this._baseAlpha);
        } else {
            this._alpha = this._baseAlpha;
        }

        this._updateRotation();
        this._applyRotation(this._previousCamera);
        this._applyRotation(this._currentCamera);

        this._camera.lerpCameras(this._previousCamera, this._currentCamera, this.alpha);
    }

    protected _getAlpha(): number {
        return this._motionless ? Math.ceil(this._alpha) : this._alpha;
    }

    private _setNodes(): void {
        this._alpha = 0;
        this._baseAlpha = 0;

        this._currentNode = this._trajectory[this._currentIndex];
        this._previousNode = this._currentIndex > 0 ? this._trajectory[this._currentIndex - 1] : null;

        this._currentCamera = this._trajectoryCameras[this._currentIndex];
        this._previousCamera = this._currentIndex > 0 ?
            this._trajectoryCameras[this._currentIndex - 1] :
            this._currentCamera.clone();

        if (this._previousNode != null) {
            let lookat: THREE.Vector3 = this._camera.lookat.clone().sub(this._camera.position);
            this._previousCamera.lookat.copy(lookat.clone().add(this._previousCamera.position));

            if (this._currentNode.pano) {
                this._currentCamera.lookat.copy(lookat.clone().add(this._currentCamera.position));
            }
        }

        let nodesSet: boolean = this._currentNode != null && this._previousNode != null;

        this._motionless = nodesSet && !(
            this._currentNode.merged &&
            this._previousNode.merged &&
            this._withinOriginalDistance() &&
            this._sameConnectedComponent()
        );
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

    private _clearRotation(): void {
        if (this._currentNode.pano) {
            return;
        }

        if (this._requestedRotationDelta != null) {
            this._requestedRotationDelta = null;
        }

        if (this._rotationDelta.isZero) {
            return;
        }

        this._rotationDelta.reset();
    }

    private _sameConnectedComponent(): boolean {
        let current: Node = this._currentNode;
        let previous: Node = this._previousNode;

        if (!current ||
            !current.apiNavImIm.merge_cc ||
            !previous ||
            !previous.apiNavImIm.merge_cc) {
            return true;
        }

        return current.apiNavImIm.merge_cc === previous.apiNavImIm.merge_cc;
    }

    private _withinOriginalDistance(): boolean {
        let current: Node = this._currentNode;
        let previous: Node = this._previousNode;

        if (!current || !previous) {
            return true;
        }

        // 50 km/h moves 28m in 2s
        let distance: number = this._spatial.distanceFromLatLon(
            current.apiNavImIm.lat,
            current.apiNavImIm.lon,
            previous.apiNavImIm.lat,
            previous.apiNavImIm.lon);

        return distance < 25;
    }
}
