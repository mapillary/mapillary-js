import {IStateContext, IState, CompletingState, IRotation} from "../State";
import {Node} from "../Graph";
import {Camera, Transform} from "../Geo";

export class StateContext implements IStateContext {
    private state: IState;

    constructor() {
        this.state = new CompletingState([]);
    }

    public get alpha(): number {
        return this.state.alpha;
    }

    public get camera(): Camera {
        return this.state.camera;
    }

    public get currentNode(): Node {
        return this.state.currentNode;
    }

    public get previousNode(): Node {
        return this.state.previousNode;
    }

    public get currentTransform(): Transform {
        return this.state.currentTransform;
    }

    public get previousTransform(): Transform {
        return this.state.previousTransform;
    }

    public get trajectory(): Node[] {
        return this.state.trajectory;
    }

    public get currentIndex(): number {
        return this.state.currentIndex;
    }

    public update(): void {
        this.state.update();
    }

    public append(nodes: Node[]): void {
        this.state.append(nodes);
    }

    public remove(n: number): void {
        this.state.remove(n);
    }

    public cut(): void {
        this.state.cut();
    }

    public set(nodes: Node[]): void {
        this.state.set(nodes);
    }

    public rotate(delta: IRotation): void {
        this.state.rotate(delta);
    }
}
