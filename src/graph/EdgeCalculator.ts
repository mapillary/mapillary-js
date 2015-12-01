import {ICalculatedEdges, IPotentialEdge, GraphConstants, Node} from "../Graph";

export class EdgeCalculator {
    public calculateEdges(node: Node): ICalculatedEdges {
        let edges: ICalculatedEdges = {};

        let nextKey: string = node.findNextKeyInSequence();
        edges[GraphConstants.DirEnum.NEXT] = [nextKey];

        let prevKey: string = node.findPrevKeyInSequence();
        edges[GraphConstants.DirEnum.PREV] = [prevKey];

        return edges;
    }

    public getPotentialEdges(node: Node, nodes: Node[], prev: Node, next: Node): IPotentialEdge[] {
        if (!node.worthy) {
            return [];
        }

        let potentialEdges: IPotentialEdge[] = [];

        return potentialEdges;
    }
}

export default EdgeCalculator;
