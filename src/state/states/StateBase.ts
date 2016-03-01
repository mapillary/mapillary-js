/// <reference path="../../../typings/browser.d.ts" />

import {IState} from "../../State";
import {Node} from "../../Graph";
import {Camera, Transform} from "../../Geo";
import {IRotation} from "../../State";

export abstract class StateBase implements IState {
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

    constructor(state: IState) {
        this._alpha = state.alpha;
        this._camera = state.camera.clone();
        this._currentIndex = state.currentIndex;

        this._trajectory = state.trajectory.slice();
        this._trajectoryTransforms = [];
        this._trajectoryCameras = [];

        for (let node of this._trajectory) {
            let transform: Transform = new Transform(node);
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
            this._trajectoryCameras[this._currentIndex] :
            new Camera();

        this._previousCamera = this._trajectoryCameras.length > 1 && this.currentIndex > 0 ?
            this._trajectoryCameras[this._currentIndex - 1] :
            this._currentCamera.clone();
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

    public abstract traverse(): StateBase;

    public abstract wait(): StateBase;

    public abstract append(nodes: Node[]): void;

    public abstract remove(n: number): void;

    public abstract cut(): void;

    public abstract set(nodes: Node[]): void;

    public abstract move(delta: number): void;

    public abstract rotate(delta: IRotation): void;

    public abstract update(): void;

    protected abstract _getAlpha(): number;
}
