import {Node} from "../Graph";

export class NodeState {
    public previous: Node;
    public current: Node;

    constructor (previous: Node, current: Node) {
        this.previous = previous;
        this.current = current;
    }

    public move(node: Node): void {
        this.previous = this.current;
        this.current = node;
    }
}
