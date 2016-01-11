import {IState} from "../../State";
import {Node} from "../../Graph";
import {Transform} from "../../Geo";

export class CompletingState implements IState {
    private _alpha: number;
    private _animationSpeed: number;

    private _currentIndex: number;

    private _trajectoryNodes: Node[];
    private _trajectoryTransforms: Transform[];

    private _currentNode: Node;
    private _previousNode: Node;

    constructor (trajectory: Node[]) {
        this._alpha = trajectory.length > 0 ? 0 : 1;
        this._animationSpeed = 0.025;

        this._trajectoryNodes = trajectory.slice();
        this._trajectoryTransforms = [];
        for (let node of this._trajectoryNodes) {
            this._trajectoryTransforms.push(new Transform(node));
        }

        this._currentIndex = 0;

        this._currentNode = trajectory.length > 0 ? trajectory[this._currentIndex] : null;
        this._previousNode = null;
    }

    public append(trajectory: Node[]): void {
        if (trajectory.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        if (this._trajectoryNodes.length === 0) {
            this._alpha = 0;

            this._currentIndex = 0;
            this._currentNode = trajectory.length > 0 ? trajectory[this._currentIndex] : null;
            this._previousNode = null;
        }

        this._trajectoryNodes = this._trajectoryNodes.concat(trajectory);
        for (let node of trajectory) {
            this._trajectoryTransforms.push(new Transform(node));
        }
    }

    public set(trajectory: Node[]): void {
        if (trajectory.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        this._trajectoryTransforms.length = 0;
        if (this._currentNode != null) {
            this._trajectoryNodes = [this._currentNode].concat(trajectory);
            for (let node of this._trajectoryNodes) {
                this._trajectoryTransforms.push(new Transform(node));
            }
            this._currentIndex = 1;
        } else {
            this._trajectoryNodes = trajectory.slice();
            for (let node of this._trajectoryNodes) {
                this._trajectoryTransforms.push(new Transform(node));
            }
            this._currentIndex = 0;
        }

        this._alpha = 0;

        this._currentNode = this.trajectory[this._currentIndex];
        this._previousNode = this._trajectoryNodes[this._currentIndex - 1];
    }

    public update(): void {
        if (this._alpha === 1 && this._currentIndex + this._alpha < this._trajectoryNodes.length) {
            this._alpha = 0;

            this._currentIndex += 1;
            this._currentNode = this._trajectoryNodes[this._currentIndex];
            this._previousNode = this._trajectoryNodes[this._currentIndex - 1];
        }

        this._alpha = Math.min(1, this._alpha + this._animationSpeed);
    }

    public get alpha(): number {
        return this._alpha;
    }

    public get currentNode(): Node {
        return this._currentNode;
    }

    public get previousNode(): Node {
        return this._previousNode;
    }

    public get currentTransform(): Transform {
        return this._trajectoryTransforms.length > 0 ?
            this._trajectoryTransforms[this._currentIndex] : null;
    }

    public get previousTransform(): Transform {
        return this._trajectoryTransforms.length > 0 && this._currentIndex > 0 ?
            this._trajectoryTransforms[this._currentIndex] : null;
    }

    public get trajectory(): Node[] {
        return this._trajectoryNodes;
    }
}
