/* Interfaces */
import {IAPINavImS} from "../api/API";
import {INode} from "./interfaces/interfaces";

export class EdgeCalculator {
    private graph: any;

    constructor (graph: any) {
        this.graph = graph;
    }

    public updateEdges(sequence: IAPINavImS, node: INode): void {
        console.log("UPDATE EDGES");
    }
}

export default EdgeCalculator;
