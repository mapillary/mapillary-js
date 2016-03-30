/// <reference path="../../../typings/browser.d.ts" />

import {ParameterMapillaryError} from "../../Error";
import {IState} from "../../State";
import {Node} from "../../Graph";
import {Camera, GeoCoords, ILatLonAlt, Transform, Spatial} from "../../Geo";
import {IRotation} from "../../State";

export abstract class StateBase implements IState {
    protected _spatial: Spatial;
    protected _geoCoords: GeoCoords;

    protected _reference: ILatLonAlt;

    protected _alpha: number;
    protected _camera: Camera;

    protected _currentIndex: number;

    protected _trajectory: Node[];
    protected _currentNode: Node;
    protected _previousNode: Node;

    protected _trajectoryTransforms: Transform[];

    protected _trajectoryCameras: Camera[];
    protected _currentCamera: Camera;
    protected _previousCamera: Camera;

    protected _motionless: boolean;

    private _referenceThreshold: number;

    constructor(state: IState) {
        this._spatial = new Spatial();
        this._geoCoords = new GeoCoords();

        this._referenceThreshold = 0.01;

        this._reference = state.reference;

        this._alpha = state.alpha;
        this._camera = state.camera.clone();
        this._currentIndex = state.currentIndex;

        this._trajectory = state.trajectory.slice();
        this._trajectoryTransforms = [];
        this._trajectoryCameras = [];

        for (let node of this._trajectory) {
            let translation: number[] = this._nodeToTranslation(node);
            let transform: Transform = new Transform(node, translation);

            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }

        this._currentNode = this._trajectory.length > 0 ?
            this._trajectory[this._currentIndex] :
            null;

        this._previousNode = this._trajectory.length > 1 && this.currentIndex > 0 ?
            this._trajectory[this._currentIndex - 1] :
            null;

        this._currentCamera = this._trajectoryCameras.length > 0 ?
            this._trajectoryCameras[this._currentIndex].clone() :
            new Camera();

        this._previousCamera = this._trajectoryCameras.length > 1 && this.currentIndex > 0 ?
            this._trajectoryCameras[this._currentIndex - 1].clone() :
            this._currentCamera.clone();
    }

    public get reference(): ILatLonAlt {
        return this._reference;
    }

    public get alpha(): number {
        return this._getAlpha();
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get trajectory(): Node[] {
        return this._trajectory;
    }

    public get currentIndex(): number {
        return this._currentIndex;
    }

    public get currentNode(): Node {
        return this._currentNode;
    }

    public get previousNode(): Node {
        return this._previousNode;
    }

    public get currentTransform(): Transform {
        return this._trajectoryTransforms.length > 0 ?
            this._trajectoryTransforms[this.currentIndex] : null;
    }

    public get previousTransform(): Transform {
        return this._trajectoryTransforms.length > 1 && this.currentIndex > 0 ?
            this._trajectoryTransforms[this.currentIndex - 1] : null;
    }

    public get motionless(): boolean {
        return this._motionless;
    }

    public abstract traverse(): StateBase;

    public abstract wait(): StateBase;

    public abstract move(delta: number): void;

    public abstract moveTo(position: number): void;

    public abstract rotate(delta: IRotation): void;

    public abstract update(fps: number): void;

    public append(nodes: Node[]): void {
        if (nodes.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        this._trajectory = this._trajectory.concat(nodes);
        this._appendToTrajectories(nodes);
    }

    public prepend(nodes: Node[]): void {
        if (nodes.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        this._trajectory = nodes.slice().concat(this._trajectory);
        this._prependToTrajectories(nodes);

        this._currentIndex += nodes.length;

        this._setCurrent();
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

    public set(nodes: Node[]): void {
        this._set(nodes);
        this._setCurrent();
    }

    protected abstract _getAlpha(): number;

    protected _set(nodes: Node[]): void {
        if (nodes.length < 1) {
            throw new ParameterMapillaryError("Trajectory can not be empty");
        }

        if (this._currentNode != null) {
            this._trajectory = [this._currentNode].concat(nodes);
            this._currentIndex = 1;
        } else {
            this._trajectory = nodes.slice();
            this._currentIndex = 0;
        }

        this._trajectoryTransforms.length = 0;
        this._trajectoryCameras.length = 0;
        this._appendToTrajectories(this._trajectory);
    }

    protected _setCurrent(): void {
        this._currentNode = this._trajectory[this._currentIndex];
        this._previousNode = this._currentIndex > 0 ?
            this._trajectory[this._currentIndex - 1] :
            null;

        this._setReference(this._currentNode);

        this._currentCamera = this._trajectoryCameras[this._currentIndex].clone();
        this._previousCamera = this._currentIndex > 0 ?
            this._trajectoryCameras[this._currentIndex - 1].clone() :
            this._currentCamera.clone();

        if (this._previousNode != null) {
            let lookat: THREE.Vector3 = this._camera.lookat.clone().sub(this._camera.position);
            if (this._previousNode.pano) {
                this._previousCamera.lookat.copy(lookat.clone().add(this._previousCamera.position));
            }

            if (this._currentNode.pano) {
                this._currentCamera.lookat.copy(lookat.clone().add(this._currentCamera.position));
            }
        }
    }

    protected _motionlessTransition(): boolean {
        let nodesSet: boolean = this._currentNode != null && this._previousNode != null;

        return nodesSet && !(
            this._currentNode.merged &&
            this._previousNode.merged &&
            this._withinOriginalDistance() &&
            this._sameConnectedComponent()
        );
    }

    private _setReference(node: Node): void {
        // do not reset reference if node is within threshold distance
        if (Math.abs(node.latLon.lat - this.reference.lat) < this._referenceThreshold &&
            Math.abs(node.latLon.lon - this.reference.lon) < this._referenceThreshold) {
            return;
        }

        // do not reset reference if previous node exist and transition is with motion
        if (this._previousNode != null && !this._motionlessTransition()) {
            return;
        }

        this._reference.lat = node.latLon.lat;
        this._reference.lon = node.latLon.lon;
        this._reference.alt = node.apiNavImIm.calt;

        this._trajectoryTransforms.length = 0;
        this._trajectoryCameras.length = 0;

        this._appendToTrajectories(this._trajectory);
    }

    private _appendToTrajectories(nodes: Node[]): void {
        for (let node of nodes) {
            if (!node.loaded) {
                throw new ParameterMapillaryError("Node must be loaded when added to trajectory");
            }

            let translation: number[] = this._nodeToTranslation(node);
            let transform: Transform = new Transform(node, translation);

            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }
    }

    private _prependToTrajectories(nodes: Node[]): void {
        for (let node of nodes.reverse()) {
            if (!node.loaded) {
                throw new ParameterMapillaryError("Node must be loaded when added to trajectory");
            }

            let translation: number[] = this._nodeToTranslation(node);
            let transform: Transform = new Transform(node, translation);

            this._trajectoryTransforms.unshift(transform);
            this._trajectoryCameras.unshift(new Camera(transform));
        }
    }

    private _nodeToTranslation(node: Node): number[] {
        let C: number[] = this._geoCoords.geodeticToEnu(
            node.latLon.lat,
            node.latLon.lon,
            node.apiNavImIm.calt,
            this._reference.lat,
            this._reference.lon,
            this._reference.alt);

        let RC: THREE.Vector3 = this._spatial.rotate(C, node.apiNavImIm.rotation);

        return [-RC.x, -RC.y, -RC.z];
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
