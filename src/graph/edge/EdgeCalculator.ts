import {Node} from "../../Graph";
import
{
    EdgeConstants,
    IStep,
    ITurn,
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
                fullPano: potential.fullPano,
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

            for (let j: number = 0; j < potentialEdges.length; j++) {
                let potential: IPotentialEdge = potentialEdges[j];

                if (Math.abs(potential.directionChange) > this.settings.stepMaxDirectionChange) {
                    continue;
                }

                let motionDifference: number =
                    this.spatial.angleDifference(step.motionChange, potential.motionChange);
                let directionMotionDifference: number =
                    this.spatial.angleDifference(potential.directionChange, motionDifference);
                let drift: number =
                    Math.max(Math.abs(motionDifference), Math.abs(directionMotionDifference));

                if (Math.abs(drift) > this.settings.stepMaxDrift) {
                    continue;
                }

                let potentialKey: string = potential.apiNavImIm.key;
                if (step.useFallback && (potentialKey === prevKey || potentialKey === nextKey)) {
                    fallbackKey = potentialKey;
                }

                if (potential.distance > this.settings.stepMaxDistance) {
                    continue;
                }

                motionDifference = Math.sqrt(
                    motionDifference * motionDifference +
                    potential.verticalMotion * potential.verticalMotion);

                let score: number =
                    this.coefficients.stepPreferredDistance *
                    Math.abs(potential.distance - this.settings.stepPreferredDistance) /
                    this.settings.stepMaxDistance +
                    this.coefficients.stepMotion * motionDifference / this.settings.stepMaxDrift +
                    this.coefficients.stepRotation * potential.rotation / this.settings.stepMaxDirectionChange +
                    this.coefficients.stepSequencePenalty * (potential.sameSequence ? 0 : 1) +
                    this.coefficients.stepMergeCcPenalty * (potential.sameMergeCc ? 0 : 1);

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

    public computeTurnEdges(potentialEdges: IPotentialEdge[]): IEdge[] {
        let edges: IEdge[] = [];

        for (let k in this.directions.turns) {
            if (!this.directions.turns.hasOwnProperty(k)) {
                continue;
            }

            let turn: ITurn = this.directions.turns[k];

            let lowestScore: number = Number.MAX_VALUE;
            let turnKey: string = null;

            for (let i: number = 0; i < potentialEdges.length; i++) {
                let potential: IPotentialEdge = potentialEdges[i];

                if (potential.distance > this.settings.turnMaxDistance) {
                    continue;
                }

                let rig: boolean =
                    turn.direction !== EdgeConstants.Direction.TURN_U &&
                    potential.distance < this.settings.turnMaxRigDistance &&
                    Math.abs(potential.directionChange) > this.settings.turnMinRigDirectionChange;

                let directionDifference: number = this.spatial.angleDifference(
                    turn.directionChange, potential.directionChange);

                let score: number;

                if (
                    rig &&
                    potential.directionChange * turn.directionChange > 0 &&
                    Math.abs(potential.directionChange) < Math.abs(turn.directionChange)) {
                    score = -Math.PI / 2 + Math.abs(potential.directionChange);
                } else {
                    if (Math.abs(directionDifference) > this.settings.turnMaxDirectionChange) {
                        continue;
                    }

                    let motionDifference: number = turn.motionChange ?
                        this.spatial.angleDifference(turn.motionChange, potential.motionChange) : 0;

                    motionDifference = Math.sqrt(
                        motionDifference * motionDifference +
                        potential.verticalMotion * potential.verticalMotion);

                    score =
                        this.coefficients.turnDistance * potential.distance /
                        this.settings.turnMaxDistance +
                        this.coefficients.turnMotion * motionDifference / Math.PI +
                        this.coefficients.turnSequencePenalty * (potential.sameSequence ? 0 : 1) +
                        this.coefficients.turnMergeCcPenalty * (potential.sameMergeCc ? 0 : 1);
                }

                if (score < lowestScore) {
                    lowestScore = score;
                    turnKey = potential.apiNavImIm.key;
                }
            }

            if (turnKey != null) {
                edges.push({
                    to: turnKey,
                    direction: turn.direction
                });
            }
        }

        return edges;
    }

    public computePanoEdges(potentialEdges: IPotentialEdge[]): IEdge[] {
        let panoEdges: IEdge[] = [];
        let potentialPanos: IPotentialEdge[] = [];

        for (let i: number = 0; i < potentialEdges.length; i++) {
            let potential: IPotentialEdge = potentialEdges[i];

            if (!potential.fullPano) {
                continue;
            }

            if (potential.distance < this.settings.panoMinDistance ||
                potential.distance > this.settings.panoMaxDistance) {
                continue;
            }

            potentialPanos.push(potential);
        }

        let maxRotationDifference: number = Math.PI / this.settings.panoMaxItems;
        let occupiedAngles: number[] = [];
        for (let index: number = 0; index < this.settings.panoMaxItems; index++) {
            let rotation: number = index / this.settings.panoMaxItems * 2 * Math.PI;

            let lowestScore: number = Number.MAX_VALUE;
            let item: IPotentialEdge = null;

            for (let i: number = 0; i < potentialPanos.length; i++) {
                let potential: IPotentialEdge = potentialPanos[i];

                let motionDifference: number = this.spatial.angleDifference(rotation, potential.motionChange);

                if (Math.abs(motionDifference) > maxRotationDifference) {
                    continue;
                }

                let occupiedDifference: number = Number.MAX_VALUE;
                for (let j: number = 0; j < occupiedAngles.length; j++) {
                    let occupiedAngle: number = occupiedAngles[j];
                    let difference: number = this.spatial.angleDifference(occupiedAngle, potential.motionChange);
                    if (Math.abs(difference) < occupiedDifference) {
                        occupiedDifference = difference;
                    }
                }

                if (occupiedDifference < maxRotationDifference) {
                    continue;
                }

                let score: number =
                    this.coefficients.panoPreferredDistance *
                    Math.abs(potential.distance - this.settings.panoPreferredDistance) /
                    this.settings.panoMaxDistance +
                    this.coefficients.panoMotion * Math.abs(motionDifference) / maxRotationDifference +
                    this.coefficients.panoSequencePenalty * (potential.sameSequence ? 0 : 1) +
                    this.coefficients.panoMergeCcPenalty * (potential.sameMergeCc ? 0 : 1);

                if (score < lowestScore) {
                    lowestScore = score;
                    item = potential;
                }
            }

            if (item != null) {
                panoEdges.push({
                    to: item.apiNavImIm.key,
                    direction: EdgeConstants.Direction.PANO
                });
            }
        }

        return panoEdges;
    }
}

export default EdgeCalculator;
