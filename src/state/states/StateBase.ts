/// <reference path="../../../typings/index.d.ts" />

import {ParameterMapillaryError} from "../../Error";
import {IState} from "../../State";
import {NewNode} from "../../Graph";
import {Camera, GeoCoords, ILatLonAlt, Transform, Spatial} from "../../Geo";
import {IRotation} from "../../State";

export abstract class StateBase implements IState {
    protected _spatial: Spatial;
    protected _geoCoords: GeoCoords;

    protected _reference: ILatLonAlt;

    protected _alpha: number;
    protected _camera: Camera;
    protected _zoom: number;

    protected _currentIndex: number;

    protected _trajectory: NewNode[];
    protected _currentNode: NewNode;
    protected _previousNode: NewNode;

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
        this._zoom = state.zoom;

        this._currentIndex = state.currentIndex;

        this._trajectory = state.trajectory.slice();
        this._trajectoryTransforms = [];
        this._trajectoryCameras = [];

        for (let node of this._trajectory) {
            let translation: number[] = this._nodeToTranslation(node);
            let transform: Transform = new Transform(node, node.image, translation);

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

    public get zoom(): number {
        return this._zoom;
    }

    public get trajectory(): NewNode[] {
        return this._trajectory;
    }

    public get currentIndex(): number {
        return this._currentIndex;
    }

    public get currentNode(): NewNode {
        return this._currentNode;
    }

    public get previousNode(): NewNode {
        return this._previousNode;
    }

    public get currentCamera(): Camera {
        return this._currentCamera;
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

    public abstract rotateBasic(basicRotation: number[]): void;

    public abstract rotateToBasic(basic: number[]): void;

    public abstract zoomIn(delta: number, reference: number[]): void;

    public abstract update(fps: number): void;

    public append(nodes: NewNode[]): void {
        if (nodes.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        if (this._currentIndex < 0) {
            this.set(nodes);
        } else {
            this._trajectory = this._trajectory.concat(nodes);
            this._appendToTrajectories(nodes);
        }
    }

    public prepend(nodes: NewNode[]): void {
        if (nodes.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        this._trajectory = nodes.slice().concat(this._trajectory);
        this._currentIndex += nodes.length;

        this._setCurrentNode();

        let referenceReset: boolean = this._setReference(this._currentNode);
        if (referenceReset) {
            this._setTrajectories();
        } else {
            this._prependToTrajectories(nodes);
        }

        this._setCurrentCamera();
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

    public set(nodes: NewNode[]): void {
        this._setTrajectory(nodes);
        this._setCurrentNode();
        this._setReference(this._currentNode);
        this._setTrajectories();
        this._setCurrentCamera();
    }

    public getCenter(): number[] {
        return this._currentNode != null ?
            this.currentTransform.projectBasic(this._camera.lookat.toArray()) :
            [0.5, 0.5];
    }

    public abstract setCenter(center: number[]): void;

    public abstract setZoom(zoom: number): void;

    protected abstract _getAlpha(): number;

    protected _setCurrent(): void {
        this._setCurrentNode();

        let referenceReset: boolean = this._setReference(this._currentNode);
        if (referenceReset) {
            this._setTrajectories();
        }

        this._setCurrentCamera();
    }

    protected _setCurrentCamera(): void {
        this._currentCamera = this._trajectoryCameras[this._currentIndex].clone();
        this._previousCamera = this._currentIndex > 0 ?
            this._trajectoryCameras[this._currentIndex - 1].clone() :
            this._currentCamera.clone();
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

    private _setReference(node: NewNode): boolean {
        // do not reset reference if node is within threshold distance
        if (Math.abs(node.latLon.lat - this.reference.lat) < this._referenceThreshold &&
            Math.abs(node.latLon.lon - this.reference.lon) < this._referenceThreshold) {
            return false;
        }

        // do not reset reference if previous node exist and transition is with motion
        if (this._previousNode != null && !this._motionlessTransition()) {
            return false;
        }

        this._reference.lat = node.latLon.lat;
        this._reference.lon = node.latLon.lon;
        this._reference.alt = node.alt;

        return true;
    }

    private _setCurrentNode(): void {
        this._currentNode = this._trajectory.length > 0 ?
            this._trajectory[this._currentIndex] :
            null;

        this._previousNode = this._currentIndex > 0 ?
            this._trajectory[this._currentIndex - 1] :
            null;
    }

    private _setTrajectory(nodes: NewNode[]): void {
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
    }

    private _setTrajectories(): void {
        this._trajectoryTransforms.length = 0;
        this._trajectoryCameras.length = 0;

        this._appendToTrajectories(this._trajectory);
    }

    private _appendToTrajectories(nodes: NewNode[]): void {
        for (let node of nodes) {
            if (!node.assetsCached) {
                throw new ParameterMapillaryError("Assets must be cached when node is added to trajectory");
            }

            let translation: number[] = this._nodeToTranslation(node);
            let transform: Transform = new Transform(node, node.image, translation);

            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }
    }

    private _prependToTrajectories(nodes: NewNode[]): void {
        for (let node of nodes.reverse()) {
            if (!node.assetsCached) {
                throw new ParameterMapillaryError("NewNode must be loaded when added to trajectory");
            }

            let translation: number[] = this._nodeToTranslation(node);
            let transform: Transform = new Transform(node, node.image, translation);

            this._trajectoryTransforms.unshift(transform);
            this._trajectoryCameras.unshift(new Camera(transform));
        }
    }

    private _nodeToTranslation(node: NewNode): number[] {
        let C: number[] = this._geoCoords.geodeticToEnu(
            node.latLon.lat,
            node.latLon.lon,
            node.alt,
            this._reference.lat,
            this._reference.lon,
            this._reference.alt);

        let RC: THREE.Vector3 = this._spatial.rotate(C, node.rotation);

        return [-RC.x, -RC.y, -RC.z];
    }

    private _sameConnectedComponent(): boolean {
        let current: NewNode = this._currentNode;
        let previous: NewNode = this._previousNode;

        if (!current ||
            !current.mergeCC ||
            !previous ||
            !previous.mergeCC) {
            return true;
        }

        return current.mergeCC === previous.mergeCC;
    }

    private _withinOriginalDistance(): boolean {
        let current: NewNode = this._currentNode;
        let previous: NewNode = this._previousNode;

        if (!current || !previous) {
            return true;
        }

        // 50 km/h moves 28m in 2s
        let distance: number = this._spatial.distanceFromLatLon(
            current.originalLatLon.lat,
            current.originalLatLon.lon,
            previous.originalLatLon.lat,
            previous.originalLatLon.lon);

        return distance < 25;
    }
}
