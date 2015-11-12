import {Node, Sequence} from "../Graph";

export class EdgeCalculator {
    private graph: any;

    constructor (graph: any) {
        this.graph = graph;
    }

    public updateEdges(sequence: Sequence, node: Node): void {
        console.log("UPDATE EDGES");
    }
}

export default EdgeCalculator;
