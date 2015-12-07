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
        edges[GraphConstants.Direction.NEXT] = [nextKey];

        let prevKey: string = node.findPrevKeyInSequence();
        edges[GraphConstants.Direction.PREV] = [prevKey];

        return edges;
    }

    public getPotentialEdges(node: Node, nodes: Node[], fallbackKeys: string[]): IPotentialEdge[] {
        if (!node.worthy || !node.merged) {
            return [];
        }

        let currentPosition: THREE.Vector3 =
            this.spatial.opticalCenter(node.apiNavImIm.rotation, node.translation);
        let currentDirection: THREE.Vector3 =
            this.spatial.viewingDirection(node.apiNavImIm.rotation);
        let currentVerticalDirection: number =
            this.spatial.angleToPlane(currentDirection.toArray(), [0, 0, 1]);

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

            if (distance > this.settings.maxDistance &&
                fallbackKeys.indexOf(potential.key) < 0) {
                continue;
            }

            let motionChange: number = this.spatial.angleBetweenVector2(
                currentDirection.x,
                currentDirection.y,
                motion.x,
                motion.y);

            let verticalMotion: number = this.spatial.angleToPlane(motion.toArray(), [0, 0, 1]);

            let direction: THREE.Vector3 =
                this.spatial.viewingDirection(potential.apiNavImIm.rotation);

            let directionChange: number = this.spatial.angleBetweenVector2(
                currentDirection.x,
                currentDirection.y,
                direction.x,
                direction.y);

            let verticalDirection: number = this.spatial.angleToPlane(direction.toArray(), [0, 0, 1]);
            let verticalDirectionChange: number = Math.abs(verticalDirection - currentVerticalDirection);

            let rotation: number = this.spatial.relativeRotationAngle(
                node.apiNavImIm.rotation,
                potential.apiNavImIm.rotation);

            let sameSequence: boolean = potential.sequence.key === node.sequence.key;

            let sameMergeCc: boolean =
                 potential.apiNavImIm.merge_cc == null ||
                 node.apiNavImIm.merge_cc == null ||
                 potential.apiNavImIm.merge_cc === node.apiNavImIm.merge_cc;

            let potentialEdge: IPotentialEdge = {
                distance: distance,
                motionChange: motionChange,
                verticalMotion: verticalMotion,
                directionChange: directionChange,
                verticalDirectionChange: verticalDirectionChange,
                rotation: rotation,
                sameSequence: sameSequence,
                sameMergeCc: sameMergeCc,
                apiNavImIm: potential.apiNavImIm
            };

            potentialEdges.push(potentialEdge);
        }

        return potentialEdges;
    }
}

export default EdgeCalculator;
