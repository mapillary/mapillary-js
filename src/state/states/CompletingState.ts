import {IState} from "../../State";
import {Node} from "../../Graph";

export class CompletingState2 implements IState {
    private _alpha: number;
    private _animationSpeed: number;

    private _trajectory: Node[];

    private _currentIndex: number;
    private _currentNode: Node;
    private _previousNode: Node;

    constructor (trajectory: Node[]) {
        this._alpha = trajectory.length > 0 ? 0 : 1;
        this._animationSpeed = 0.025;

        this._trajectory = trajectory.slice();

        this._currentIndex = 0;
        this._currentNode = trajectory.length > 0 ? trajectory[this._currentIndex] : null;
        this._previousNode = null;
    }

    public append(trajectory: Node[]): void {
        this._trajectory = this._trajectory.concat(trajectory);
    }

    public set(trajectory: Node[]): void {
        if (trajectory.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        if (this._currentNode != null) {
            this._trajectory = [this._currentNode].concat(trajectory);
            this._currentIndex = 1;
        } else {
            this._trajectory = trajectory.slice();
            this._currentIndex = 0;
        }

        this._alpha = 0;

        this._currentNode = this.trajectory[this._currentIndex];
        this._previousNode = this._trajectory[this._currentIndex - 1];
    }

    public update(): void {
        if (this._alpha === 1 && this._currentIndex + this._alpha < this._trajectory.length) {
            this._alpha = 0;

            this._currentIndex += 1;
            this._currentNode = this._trajectory[this._currentIndex];
            this._previousNode = this._trajectory[this._currentIndex - 1];
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

    public get trajectory(): Node[] {
        return this._trajectory;
    }
}
