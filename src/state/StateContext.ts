import {Node} from "../Graph";
import {NodeState} from "../State";

export class StateContext {
    private node: NodeState;

    constructor () {
        this.node = new NodeState(null, null);
    }

    public move(node: Node): void {
        this.node.move(node);
    }
}
