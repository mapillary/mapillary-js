import {Node} from "../Graph";
import {NodeState, IStateWrapper} from "../State";

export class StateContext {
    public node: NodeState;
    public current: IStateWrapper;

    private callbacks: Array<IAction<IStateWrapper>>;

    constructor () {
        this.node = new NodeState(null, null);

        this.current = new CurrentWrapper(this);

        this.callbacks = new Array<IAction<IStateWrapper>>();

        window.requestAnimationFrame(this.frame.bind(this));
    }

    public register(callback: IAction<IStateWrapper>): void {
        this.callbacks.push(callback);
    }

    public move(node: Node): void {
        this.node.move(node);
    }

    private frame(): void {
        window.requestAnimationFrame(this.frame.bind(this));

        for (var i: number = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](this.current);
        }
    }
}

interface IAction<T> {
    (item: T): void;
}

class CurrentWrapper implements IStateWrapper {
    private context: StateContext;

    constructor (context: StateContext) {
        this.context = context;
    }

    public get node(): Node {
        return this.context.node.current;
    }
}
