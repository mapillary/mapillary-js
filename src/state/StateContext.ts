import {Node} from "../Graph";
import {NodeState} from "../State";

export class StateContext {
    public node: NodeState;
    public current: IPropertyWrapper;

    private callbacks: Array<IAction<Node>>;

    constructor () {
        this.node = new NodeState(null, null);

        this.current = new CurrentWrapper(this);

        this.callbacks = new Array<IAction<Node>>();

        window.requestAnimationFrame(this.frame.bind(this));
    }

    public register(callback: IAction<Node>): void {
        this.callbacks.push(callback);
    }

    public move(node: Node): void {
        this.node.move(node);
    }

    private frame(): void {
        window.requestAnimationFrame(this.frame.bind(this));

        for (var i: number = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](this.node.current);
        }
    }
}

interface IAction<T> {
    (item: T): void;
}

interface IPropertyWrapper {
   node: Node;
}

class CurrentWrapper implements IPropertyWrapper {
    private context: StateContext;

    constructor (context: StateContext) {
        this.context = context;
    }

    public get node(): Node {
        return this.context.node.current;
    }
}
