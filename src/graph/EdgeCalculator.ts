import {ICalculatedEdges, IPotentialEdge, IEdge, GraphConstants, Node, EdgeCalculatorSettings} from "../Graph";
import {Spatial} from "../Geo";

interface IStep {
    direction: GraphConstants.Direction;
    motionChange: number;
    maxDirectionChange: number;
    maxDrift: number;
    useFallback: boolean;
}

export class EdgeCalculator {

    private steps: IStep[] = [
        {
            direction: GraphConstants.Direction.STEP_FORWARD,
            motionChange: 0,
            maxDirectionChange: Math.PI / 6,
            maxDrift: Math.PI / 6,
            useFallback: true
        },
        {
            direction: GraphConstants.Direction.STEP_BACKWARD,
            motionChange: Math.PI,
            maxDirectionChange: Math.PI / 6,
            maxDrift: Math.PI / 6,
            useFallback: true
        },
        {
            direction: GraphConstants.Direction.STEP_LEFT,
            motionChange: Math.PI / 2,
            maxDirectionChange: Math.PI / 6,
            maxDrift: Math.PI / 6,
            useFallback: false
        },
        {
            direction: GraphConstants.Direction.STEP_RIGHT,
            motionChange: -Math.PI / 2,
            maxDirectionChange: Math.PI / 6,
            maxDrift: Math.PI / 6,
            useFallback: false
        }
    ];

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

    public computeStepEdges(potentialEdges: IPotentialEdge[], prevKey: string, nextKey: string): IEdge[] {
        let edges: IEdge[] = [];

        for (var i: number = 0; i < this.steps.length; i++) {
            let step: IStep = this.steps[i];

            let lowestScore: number = Number.MAX_VALUE;
            let stepKey: string = null;
            let fallbackKey: string = null;

            for (var j: number = 0; j < potentialEdges.length; j++) {
                let potential: IPotentialEdge = potentialEdges[j];

                if (Math.abs(potential.directionChange) > step.maxDirectionChange) {
                    continue;
                }

                let motionDifference: number =
                    this.spatial.angleDifference(step.motionChange, potential.motionChange);
                let directionMotionDifference: number =
                    this.spatial.angleDifference(potential.directionChange, motionDifference);
                let drift: number =
                    Math.max(Math.abs(motionDifference), Math.abs(directionMotionDifference));

                if (Math.abs(drift) > step.maxDrift) {
                    continue;
                }

                let potentialKey: string = potential.apiNavImIm.key;
                if (step.useFallback && (potentialKey === prevKey || potentialKey === nextKey)) {
                    fallbackKey = potentialKey;
                }

                if (potential.distance > this.settings.maxDistance) {
                    continue;
                }

                motionDifference = Math.sqrt(
                    motionDifference * motionDifference +
                    potential.verticalMotion * potential.verticalMotion);

                let score: number =
                    2 * potential.distance / this.settings.maxDistance +
                    2 * motionDifference / step.maxDrift +
                    2 * potential.rotation / step.maxDirectionChange +
                    2 * (potential.sameSequence ? 1 : 0) +
                    2 * (potential.sameMergeCc ? 1 : 0);

                if (score < lowestScore) {
                    lowestScore = score;
                    stepKey = potentialKey;
                }
            }

            let key: string = stepKey == null ? fallbackKey : stepKey;
            if (key != null) {
                edges.push({
                    to: key,
                    direction: step.direction
                });
            }
        }

        return edges;
    }
}

export default EdgeCalculator;
