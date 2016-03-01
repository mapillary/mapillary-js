/// <reference path="../../../typings/browser.d.ts" />

import {IState} from "../../State";
import {Node} from "../../Graph";
import {Camera, Transform} from "../../Geo";
import {IRotation} from "../../State";

export abstract class StateBase implements IState {
    protected _alpha: number;
    protected _camera: Camera;

    protected _trajectory: Node[];
    protected _currentIndex: number;
    protected _currentNode: Node;
    protected _previousNode: Node;

    protected _trajectoryTransforms: Transform[];

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

    public abstract update(): void;

    public abstract append(nodes: Node[]): void;

    public abstract remove(n: number): void;

    public abstract cut(): void;

    public abstract set(nodes: Node[]): void;

    public abstract rotate(delta: IRotation): void;

    protected abstract _getAlpha(): number;
}
