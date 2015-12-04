import {ICalculatedEdges, IPotentialEdge, GraphConstants, Node, EdgeCalculatorSettings} from "../Graph";
import {Spatial} from "../Geo";

export class EdgeCalculator {

    private spatial: Spatial;
    private settings: EdgeCalculatorSettings;

    constructor(settings?: EdgeCalculatorSettings) {
        this.spatial = new Spatial();
        this.settings = settings != null ? settings : new EdgeCalculatorSettings();
    }

    public calculateEdges(node: Node): ICalculatedEdges {
        let edges: ICalculatedEdges = {};

        let nextKey: string = node.findNextKeyInSequence();
        edges[GraphConstants.DirEnum.NEXT] = [nextKey];

        let prevKey: string = node.findPrevKeyInSequence();
        edges[GraphConstants.DirEnum.PREV] = [prevKey];

        return edges;
    }

    public getPotentialEdges(node: Node, nodes: Node[], prev: Node, next: Node): IPotentialEdge[] {
        if (!node.worthy || !node.merged) {
            return [];
        }

        let currentPosition: THREE.Vector3 =
            this.spatial.opticalCenter(node.apiNavImIm.rotation, node.translation);

        let potentialEdges: IPotentialEdge[] = [];

        for (var i: number = 0; i < nodes.length; i++) {
            let potential: Node = nodes[i];

            if (!potential.worthy ||
                !potential.merged ||
                potential.key === node.key) {
                continue;
            }

            let position: THREE.Vector3 =
                this.spatial.opticalCenter(potential.apiNavImIm.rotation, potential.translation);

            let motion: THREE.Vector3 = position.clone().sub(currentPosition);
            let distance: number = motion.length();

            if (distance > this.settings.maxDistance) {
                continue;
            }

            let potentialEdge: IPotentialEdge = {
                distance: distance,
                apiNavImIm: potential.apiNavImIm
            };

            potentialEdges.push(potentialEdge);
        }

        return potentialEdges;
    }
}

export default EdgeCalculator;
