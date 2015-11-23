import {Node} from "../Graph";
import {NodeState} from "../State";

export class StateContext {
    public node: NodeState;
    public current: IPropertyWrapper;

    constructor () {
        this.node = new NodeState(null, null);

        this.current = new CurrentWrapper(this);

        window.requestAnimationFrame(this.frame.bind(this));
    }

    public move(node: Node): void {
        this.node.move(node);
    }

    private frame(): void {
        window.requestAnimationFrame(this.frame.bind(this));
    }
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
