import {IStateContext, IState, TraversingState, IRotation} from "../State";
import {Node} from "../Graph";
import {Camera, Transform} from "../Geo";

export class StateContext implements IStateContext {
    private _state: IState;

    constructor() {
        this._state = new TraversingState([]);
    }

    public get alpha(): number {
        return this._state.alpha;
    }

    public get camera(): Camera {
        return this._state.camera;
    }

    public get currentNode(): Node {
        return this._state.currentNode;
    }

    public get previousNode(): Node {
        return this._state.previousNode;
    }

    public get currentTransform(): Transform {
        return this._state.currentTransform;
    }

    public get previousTransform(): Transform {
        return this._state.previousTransform;
    }

    public get trajectory(): Node[] {
        return this._state.trajectory;
    }

    public get currentIndex(): number {
        return this._state.currentIndex;
    }

    public get lastNode(): Node {
        return this._state.trajectory[this._state.trajectory.length - 1];
    }

    public get nodesAhead(): number {
        return this._state.trajectory.length - 1 - this._state.currentIndex;
    }

    public update(): void {
        this._state.update();
    }

    public append(nodes: Node[]): void {
        this._state.append(nodes);
    }

    public remove(n: number): void {
        this._state.remove(n);
    }

    public cut(): void {
        this._state.cut();
    }

    public set(nodes: Node[]): void {
        this._state.set(nodes);
    }

    public rotate(delta: IRotation): void {
        this._state.rotate(delta);
    }
}
