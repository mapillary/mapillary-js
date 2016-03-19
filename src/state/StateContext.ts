import {
    IStateContext,
    StateBase,
    State,
    TraversingState,
    WaitingState,
    IRotation,
} from "../State";
import {Node} from "../Graph";
import {Camera, Transform} from "../Geo";

export class StateContext implements IStateContext {
    private _state: StateBase;

    constructor() {
        this._state = new TraversingState({
            alpha: 1,
            camera: new Camera(),
            currentIndex: 0,
            trajectory: [],
        });
    }

    public traverse(): void {
        this._state = this._state.traverse();
    }

    public wait(): void {
        this._state = this._state.wait();
    }

    public get state(): State {
        if (this._state instanceof TraversingState) {
            return State.Traversing;
        } else if (this._state instanceof WaitingState) {
            return State.Waiting;
        }

        throw new Error("Invalid state");
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

    public get motionless(): boolean {
        return this._state.motionless;
    }

    public update(fps: number): void {
        this._state.update(fps);
    }

    public append(nodes: Node[]): void {
        this._state.append(nodes);
    }

    public prepend(nodes: Node[]): void {
        this._state.prepend(nodes);
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

    public move(delta: number): void {
        this._state.move(delta);
    }

    public moveTo(delta: number): void {
        this._state.moveTo(delta);
    }
}
