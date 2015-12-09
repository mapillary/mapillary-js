import {Node} from "../../Graph";
import
{
    EdgeConstants,
    IStep,
    IEdge,
    IPotentialEdge,
    ICalculatedEdges,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeCalculatorCoefficients
} from "../../Edge";
import {Spatial} from "../../Geo";

export class EdgeCalculator {

    private spatial: Spatial;
    private settings: EdgeCalculatorSettings;
    private directions: EdgeCalculatorDirections;
    private coefficients: EdgeCalculatorCoefficients;

    constructor(
        settings?: EdgeCalculatorSettings,
        directions?: EdgeCalculatorDirections,
        coefficients?: EdgeCalculatorCoefficients) {
        this.spatial = new Spatial();
        this.settings = settings != null ? settings : new EdgeCalculatorSettings();
        this.directions = directions != null ? directions : new EdgeCalculatorDirections();
        this.coefficients = coefficients != null ? coefficients : new EdgeCalculatorCoefficients();
    }

    public calculateEdges(node: Node): ICalculatedEdges {
        let edges: ICalculatedEdges = {};

        let nextKey: string = node.findNextKeyInSequence();
        edges[EdgeConstants.Direction.NEXT] = [nextKey];

        let prevKey: string = node.findPrevKeyInSequence();
        edges[EdgeConstants.Direction.PREV] = [prevKey];

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

        for (let k in this.directions.steps) {
            if (!this.directions.steps.hasOwnProperty(k)) {
                continue;
            }

            let step: IStep = this.directions.steps[k];

            let lowestScore: number = Number.MAX_VALUE;
            let stepKey: string = null;
            let fallbackKey: string = null;

            for (var j: number = 0; j < potentialEdges.length; j++) {
                let potential: IPotentialEdge = potentialEdges[j];

                if (Math.abs(potential.directionChange) > this.settings.maxStepDirectionChange) {
                    continue;
                }

                let motionDifference: number =
                    this.spatial.angleDifference(step.motionChange, potential.motionChange);
                let directionMotionDifference: number =
                    this.spatial.angleDifference(potential.directionChange, motionDifference);
                let drift: number =
                    Math.max(Math.abs(motionDifference), Math.abs(directionMotionDifference));

                if (Math.abs(drift) > this.settings.maxStepDrift) {
                    continue;
                }

                let potentialKey: string = potential.apiNavImIm.key;
                if (step.useFallback && (potentialKey === prevKey || potentialKey === nextKey)) {
                    fallbackKey = potentialKey;
                }

                if (potential.distance > this.settings.maxStepDistance) {
                    continue;
                }

                motionDifference = Math.sqrt(
                    motionDifference * motionDifference +
                    potential.verticalMotion * potential.verticalMotion);

                let score: number =
                    this.coefficients.stepPreferredDistance *
                    Math.abs(potential.distance - this.settings.preferredStepDistance) /
                    this.settings.maxStepDistance +
                    this.coefficients.stepMotion * motionDifference / this.settings.maxStepDrift +
                    this.coefficients.stepRotation * potential.rotation / this.settings.maxStepDirectionChange +
                    this.coefficients.stepSequencePenalty * (potential.sameSequence ? 1 : 0) +
                    this.coefficients.stepMergeCcPenalty * (potential.sameMergeCc ? 1 : 0);

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
