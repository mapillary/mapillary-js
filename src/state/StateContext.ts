import {IStateContext, IState, CompletingState2} from "../State";
import {Node} from "../Graph";

export class StateContext implements IStateContext {
    private state: IState;

    constructor() {
        this.state = new CompletingState2([]);
    }

    public get alpha(): number {
        return this.state.alpha;
    }

    public get currentNode(): Node {
        return this.state.currentNode;
    }

    public get previousNode(): Node {
        return this.state.previousNode;
    }

    public get trajectory(): Node[] {
        return this.state.trajectory;
    }

    public update(): void {
        this.state.update();
    }

    public append(nodes: Node[]): void {
        this.state.append(nodes);
    }

    public set(nodes: Node[]): void {
        this.state.set(nodes);
    }
}
