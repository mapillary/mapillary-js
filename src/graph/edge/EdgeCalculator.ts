import * as THREE from "three";

import {
    Node,
    Sequence,
} from "../../Graph";
import
{
    EdgeDirection,
    IStep,
    ITurn,
    IPano,
    IEdge,
    IPotentialEdge,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeCalculatorCoefficients,
} from "../../Edge";
import {ArgumentMapillaryError} from "../../Error";
import {GeoCoords, Spatial} from "../../Geo";

/**
 * @class EdgeCalculator
 *
 * @classdesc Represents a class for calculating node edges.
 */
export class EdgeCalculator {

    private _spatial: Spatial;
    private _geoCoords: GeoCoords;

    private _settings: EdgeCalculatorSettings;
    private _directions: EdgeCalculatorDirections;
    private _coefficients: EdgeCalculatorCoefficients;

    /**
     * Create a new edge calculator instance.
     *
     * @param {EdgeCalculatorSettings} settings - Settings struct.
     * @param {EdgeCalculatorDirections} directions - Directions struct.
     * @param {EdgeCalculatorCoefficients} coefficients - Coefficients struct.
     */
    constructor(
        settings?: EdgeCalculatorSettings,
        directions?: EdgeCalculatorDirections,
        coefficients?: EdgeCalculatorCoefficients) {

        this._spatial = new Spatial();
        this._geoCoords = new GeoCoords();

        this._settings = settings != null ? settings : new EdgeCalculatorSettings();
        this._directions = directions != null ? directions : new EdgeCalculatorDirections();
        this._coefficients = coefficients != null ? coefficients : new EdgeCalculatorCoefficients();
    }

    /**
     * Returns the potential edges to destination nodes for a set
     * of nodes with respect to a source node.
     *
     * @param {Node} node - Source node.
     * @param {Array<Node>} nodes - Potential destination nodes.
     * @param {Array<string>} fallbackKeys - Keys for destination nodes that should
     * be returned even if they do not meet the criteria for a potential edge.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public getPotentialEdges(node: Node, potentialNodes: Node[], fallbackKeys: string[]): IPotentialEdge[] {
        if (!node.full) {
            throw new ArgumentMapillaryError("Node has to be full.");
        }

        if (!node.merged) {
            return [];
        }

        let currentDirection: THREE.Vector3 =
            this._spatial.viewingDirection(node.rotation);
        let currentVerticalDirection: number =
            this._spatial.angleToPlane(currentDirection.toArray(), [0, 0, 1]);

        let potentialEdges: IPotentialEdge[] = [];

        for (let potential of potentialNodes) {
            if (!potential.merged ||
                potential.key === node.key) {
                continue;
            }

            let enu: number[] = this._geoCoords.geodeticToEnu(
                potential.latLon.lat,
                potential.latLon.lon,
                potential.alt,
                node.latLon.lat,
                node.latLon.lon,
                node.alt);

            let motion: THREE.Vector3 = new THREE.Vector3(enu[0], enu[1], enu[2]);
            let distance: number = motion.length();

            if (distance > this._settings.maxDistance &&
                fallbackKeys.indexOf(potential.key) < 0) {
                continue;
            }

            let motionChange: number = this._spatial.angleBetweenVector2(
                currentDirection.x,
                currentDirection.y,
                motion.x,
                motion.y);

            let verticalMotion: number = this._spatial.angleToPlane(motion.toArray(), [0, 0, 1]);

            let direction: THREE.Vector3 =
                this._spatial.viewingDirection(potential.rotation);

            let directionChange: number = this._spatial.angleBetweenVector2(
                currentDirection.x,
                currentDirection.y,
                direction.x,
                direction.y);

            let verticalDirection: number = this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);
            let verticalDirectionChange: number = verticalDirection - currentVerticalDirection;

            let rotation: number = this._spatial.relativeRotationAngle(
                node.rotation,
                potential.rotation);

            let worldMotionAzimuth: number =
                this._spatial.angleBetweenVector2(1, 0, motion.x, motion.y);

            let sameSequence: boolean = potential.sequenceKey != null &&
                node.sequenceKey != null &&
                potential.sequenceKey === node.sequenceKey;

            let sameMergeCC: boolean =
                 (potential.mergeCC == null && node.mergeCC == null) ||
                 potential.mergeCC === node.mergeCC;

            let sameUser: boolean =
                potential.userKey === node.userKey;

            let potentialEdge: IPotentialEdge = {
                capturedAt: potential.capturedAt,
                croppedPano: potential.pano && !potential.fullPano,
                directionChange: directionChange,
                distance: distance,
                fullPano: potential.fullPano,
                key: potential.key,
                motionChange: motionChange,
                rotation: rotation,
                sameMergeCC: sameMergeCC,
                sameSequence: sameSequence,
                sameUser: sameUser,
                sequenceKey: potential.sequenceKey,
                verticalDirectionChange: verticalDirectionChange,
                verticalMotion: verticalMotion,
                worldMotionAzimuth: worldMotionAzimuth,
            };

            potentialEdges.push(potentialEdge);
        }

        return potentialEdges;
    }

    /**
     * Computes the sequence edges for a node.
     *
     * @param {Node} node - Source node.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeSequenceEdges(node: Node, sequence: Sequence): IEdge[] {
        if (!node.full) {
            throw new ArgumentMapillaryError("Node has to be full.");
        }

        if (node.sequenceKey !== sequence.key) {
            throw new ArgumentMapillaryError("Node and sequence does not correspond.");
        }

        let edges: IEdge[] = [];

        let nextKey: string = sequence.findNextKey(node.key);
        if (nextKey != null) {
            edges.push({
                data: {
                    direction: EdgeDirection.Next,
                    worldMotionAzimuth: Number.NaN,
                },
                from: node.key,
                to: nextKey,
            });
        }

        let prevKey: string = sequence.findPrevKey(node.key);
        if (prevKey != null) {
            edges.push({
                data: {
                    direction: EdgeDirection.Prev,
                    worldMotionAzimuth: Number.NaN,
                },
                from: node.key,
                to: prevKey,
            });
        }

        return edges;
    }

    /**
     * Computes the similar edges for a node.
     *
     * @description Similar edges for perspective images and cropped panoramas
     * look roughly in the same direction and are positioned closed to the node.
     * Similar edges for full panoramas only target other full panoramas.
     *
     * @param {Node} node - Source node.
     * @param {Array<IPotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeSimilarEdges(node: Node, potentialEdges: IPotentialEdge[]): IEdge[] {
        if (!node.full) {
            throw new ArgumentMapillaryError("Node has to be full.");
        }

        let nodeFullPano: boolean = node.fullPano;
        let sequenceGroups: { [key: string]: IPotentialEdge[] } = {};

        for (let potentialEdge of potentialEdges) {
            if (potentialEdge.sequenceKey == null) {
                continue;
            }

            if (potentialEdge.sameSequence) {
                continue;
            }

            if (nodeFullPano) {
                if (!potentialEdge.fullPano) {
                    continue;
                }
            } else {
                if (!potentialEdge.fullPano &&
                    Math.abs(potentialEdge.directionChange) > this._settings.similarMaxDirectionChange) {
                    continue;
                }
            }

            if (potentialEdge.distance > this._settings.similarMaxDistance) {
                continue;
            }

            if (potentialEdge.sameUser &&
                Math.abs(potentialEdge.capturedAt - node.capturedAt) <
                    this._settings.similarMinTimeDifference) {
                continue;
            }

            if (sequenceGroups[potentialEdge.sequenceKey] == null) {
                sequenceGroups[potentialEdge.sequenceKey] = [];
            }

            sequenceGroups[potentialEdge.sequenceKey].push(potentialEdge);

        }

        let similarEdges: IPotentialEdge[] = [];

        let calculateScore: (potentialEdge: IPotentialEdge) => number =
            node.fullPano ?
                (potentialEdge: IPotentialEdge): number => {
                    return potentialEdge.distance;
                } :
                (potentialEdge: IPotentialEdge): number => {
                    return this._coefficients.similarDistance * potentialEdge.distance +
                        this._coefficients.similarRotation * potentialEdge.rotation;
                };

        for (let sequenceKey in sequenceGroups) {
            if (!sequenceGroups.hasOwnProperty(sequenceKey)) {
                continue;
            }

            let lowestScore: number = Number.MAX_VALUE;
            let similarEdge: IPotentialEdge = null;

            for (let potentialEdge of sequenceGroups[sequenceKey]) {
                let score: number = calculateScore(potentialEdge);

                if (score < lowestScore) {
                    lowestScore = score;
                    similarEdge = potentialEdge;
                }
            }

            if (similarEdge == null) {
                continue;
            }

            similarEdges.push(similarEdge);
        }

        return similarEdges
            .map<IEdge>(
                (potentialEdge: IPotentialEdge): IEdge => {
                    return {
                        data: {
                            direction: EdgeDirection.Similar,
                            worldMotionAzimuth: potentialEdge.worldMotionAzimuth,
                        },
                        from: node.key,
                        to: potentialEdge.key,
                    };
                });
    }

    /**
     * Computes the step edges for a perspective node.
     *
     * @description Step edge targets can only be other perspective nodes.
     * Returns an empty array for cropped and full panoramas.
     *
     * @param {Node} node - Source node.
     * @param {Array<IPotentialEdge>} potentialEdges - Potential edges.
     * @param {string} prevKey - Key of previous node in sequence.
     * @param {string} prevKey - Key of next node in sequence.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeStepEdges(
        node: Node,
        potentialEdges: IPotentialEdge[],
        prevKey: string,
        nextKey: string): IEdge[] {

        if (!node.full) {
            throw new ArgumentMapillaryError("Node has to be full.");
        }

        let edges: IEdge[] = [];

        if (node.pano) {
            return edges;
        }

        for (let k in this._directions.steps) {
            if (!this._directions.steps.hasOwnProperty(k)) {
                continue;
            }

            let step: IStep = this._directions.steps[k];

            let lowestScore: number = Number.MAX_VALUE;
            let edge: IPotentialEdge = null;
            let fallback: IPotentialEdge = null;

            for (let potential of potentialEdges) {
                if (potential.croppedPano || potential.fullPano) {
                    continue;
                }

                if (Math.abs(potential.directionChange) > this._settings.stepMaxDirectionChange) {
                    continue;
                }

                let motionDifference: number =
                    this._spatial.angleDifference(step.motionChange, potential.motionChange);
                let directionMotionDifference: number =
                    this._spatial.angleDifference(potential.directionChange, motionDifference);
                let drift: number =
                    Math.max(Math.abs(motionDifference), Math.abs(directionMotionDifference));

                if (Math.abs(drift) > this._settings.stepMaxDrift) {
                    continue;
                }

                let potentialKey: string = potential.key;
                if (step.useFallback && (potentialKey === prevKey || potentialKey === nextKey)) {
                    fallback = potential;
                }

                if (potential.distance > this._settings.stepMaxDistance) {
                    continue;
                }

                motionDifference = Math.sqrt(
                    motionDifference * motionDifference +
                    potential.verticalMotion * potential.verticalMotion);

                let score: number =
                    this._coefficients.stepPreferredDistance *
                    Math.abs(potential.distance - this._settings.stepPreferredDistance) /
                    this._settings.stepMaxDistance +
                    this._coefficients.stepMotion * motionDifference / this._settings.stepMaxDrift +
                    this._coefficients.stepRotation * potential.rotation / this._settings.stepMaxDirectionChange +
                    this._coefficients.stepSequencePenalty * (potential.sameSequence ? 0 : 1) +
                    this._coefficients.stepMergeCCPenalty * (potential.sameMergeCC ? 0 : 1);

                if (score < lowestScore) {
                    lowestScore = score;
                    edge = potential;
                }
            }

            edge = edge == null ? fallback : edge;
            if (edge != null) {
                edges.push({
                    data: {
                        direction: step.direction,
                        worldMotionAzimuth: edge.worldMotionAzimuth,
                    },
                    from: node.key,
                    to: edge.key,
                });
            }
        }

        return edges;
    }

    /**
     * Computes the turn edges for a perspective node.
     *
     * @description Turn edge targets can only be other perspective images.
     * Returns an empty array for cropped and full panoramas.
     *
     * @param {Node} node - Source node.
     * @param {Array<IPotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeTurnEdges(node: Node, potentialEdges: IPotentialEdge[]): IEdge[] {
        if (!node.full) {
            throw new ArgumentMapillaryError("Node has to be full.");
        }

        let edges: IEdge[] = [];

        if (node.pano) {
            return edges;
        }

        for (let k in this._directions.turns) {
            if (!this._directions.turns.hasOwnProperty(k)) {
                continue;
            }

            let turn: ITurn = this._directions.turns[k];

            let lowestScore: number = Number.MAX_VALUE;
            let edge: IPotentialEdge = null;

            for (let potential of potentialEdges) {
                if (potential.croppedPano || potential.fullPano) {
                    continue;
                }

                if (potential.distance > this._settings.turnMaxDistance) {
                    continue;
                }

                let rig: boolean =
                    turn.direction !== EdgeDirection.TurnU &&
                    potential.distance < this._settings.turnMaxRigDistance &&
                    Math.abs(potential.directionChange) > this._settings.turnMinRigDirectionChange;

                let directionDifference: number = this._spatial.angleDifference(
                    turn.directionChange, potential.directionChange);

                let score: number;

                if (
                    rig &&
                    potential.directionChange * turn.directionChange > 0 &&
                    Math.abs(potential.directionChange) < Math.abs(turn.directionChange)) {
                    score = -Math.PI / 2 + Math.abs(potential.directionChange);
                } else {
                    if (Math.abs(directionDifference) > this._settings.turnMaxDirectionChange) {
                        continue;
                    }

                    let motionDifference: number = turn.motionChange ?
                        this._spatial.angleDifference(turn.motionChange, potential.motionChange) : 0;

                    motionDifference = Math.sqrt(
                        motionDifference * motionDifference +
                        potential.verticalMotion * potential.verticalMotion);

                    score =
                        this._coefficients.turnDistance * potential.distance /
                        this._settings.turnMaxDistance +
                        this._coefficients.turnMotion * motionDifference / Math.PI +
                        this._coefficients.turnSequencePenalty * (potential.sameSequence ? 0 : 1) +
                        this._coefficients.turnMergeCCPenalty * (potential.sameMergeCC ? 0 : 1);
                }

                if (score < lowestScore) {
                    lowestScore = score;
                    edge = potential;
                }
            }

            if (edge != null) {
                edges.push({
                    data: {
                        direction: turn.direction,
                        worldMotionAzimuth: edge.worldMotionAzimuth,
                    },
                    from: node.key,
                    to: edge.key,
                });
            }
        }

        return edges;
    }

    /**
     * Computes the pano edges for a perspective node.
     *
     * @description Perspective to pano edge targets can only be
     * full pano nodes. Returns an empty array for cropped and full panoramas.
     *
     * @param {Node} node - Source node.
     * @param {Array<IPotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computePerspectiveToPanoEdges(node: Node, potentialEdges: IPotentialEdge[]): IEdge[] {
        if (!node.full) {
            throw new ArgumentMapillaryError("Node has to be full.");
        }

        if (node.pano) {
            return [];
        }

        let lowestScore: number = Number.MAX_VALUE;
        let edge: IPotentialEdge = null;

        for (let potential of potentialEdges) {
            if (!potential.fullPano) {
                continue;
            }

            let score: number =
                this._coefficients.panoPreferredDistance *
                Math.abs(potential.distance - this._settings.panoPreferredDistance) /
                this._settings.panoMaxDistance +
                this._coefficients.panoMotion * Math.abs(potential.motionChange) / Math.PI +
                this._coefficients.panoMergeCCPenalty * (potential.sameMergeCC ? 0 : 1);

            if (score < lowestScore) {
                lowestScore = score;
                edge = potential;
            }
        }

        if (edge == null) {
            return [];
        }

        return [
            {
                data: {
                    direction: EdgeDirection.Pano,
                    worldMotionAzimuth: edge.worldMotionAzimuth,
                },
                from: node.key,
                to: edge.key,
            },
        ];
    }

    /**
     * Computes the full pano and step edges for a full pano node.
     *
     * @description Pano to pano edge targets can only be
     * full pano nodes. Pano to step edge targets can only be perspective
     * nodes.
     * Returns an empty array for cropped panoramas and perspective nodes.
     *
     * @param {Node} node - Source node.
     * @param {Array<IPotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computePanoEdges(node: Node, potentialEdges: IPotentialEdge[]): IEdge[] {
        if (!node.full) {
            throw new ArgumentMapillaryError("Node has to be full.");
        }

        if (!node.fullPano) {
            return [];
        }

        let panoEdges: IEdge[] = [];
        let potentialPanos: IPotentialEdge[] = [];
        let potentialSteps: [EdgeDirection, IPotentialEdge][] = [];

        for (let potential of potentialEdges) {
            if (potential.distance > this._settings.panoMaxDistance) {
                continue;
            }

            if (potential.fullPano) {
                if (potential.distance < this._settings.panoMinDistance) {
                    continue;
                }

                potentialPanos.push(potential);
            } else {
                if (potential.croppedPano) {
                    continue;
                }

                for (let k in this._directions.panos) {
                    if (!this._directions.panos.hasOwnProperty(k)) {
                        continue;
                    }

                    let pano: IPano = this._directions.panos[k];

                    let turn: number = this._spatial.angleDifference(
                        potential.directionChange,
                        potential.motionChange);

                    let turnChange: number = this._spatial.angleDifference(pano.directionChange, turn);

                    if (Math.abs(turnChange) > this._settings.panoMaxStepTurnChange) {
                        continue;
                    }

                    potentialSteps.push([pano.direction, potential]);

                    // break if step direction found
                    break;
                }
            }
        }

        let maxRotationDifference: number = Math.PI / this._settings.panoMaxItems;
        let occupiedAngles: number[] = [];
        let stepAngles: number[] = [];

        for (let index: number = 0; index < this._settings.panoMaxItems; index++) {
            let rotation: number = index / this._settings.panoMaxItems * 2 * Math.PI;

            let lowestScore: number = Number.MAX_VALUE;
            let edge: IPotentialEdge = null;

            for (let potential of potentialPanos) {
                let motionDifference: number = this._spatial.angleDifference(rotation, potential.motionChange);

                if (Math.abs(motionDifference) > maxRotationDifference) {
                    continue;
                }

                let occupiedDifference: number = Number.MAX_VALUE;
                for (let occupiedAngle of occupiedAngles) {
                    let difference: number = Math.abs(this._spatial.angleDifference(occupiedAngle, potential.motionChange));
                    if (difference < occupiedDifference) {
                        occupiedDifference = difference;
                    }
                }

                if (occupiedDifference <= maxRotationDifference) {
                    continue;
                }

                let score: number =
                    this._coefficients.panoPreferredDistance *
                    Math.abs(potential.distance - this._settings.panoPreferredDistance) /
                    this._settings.panoMaxDistance +
                    this._coefficients.panoMotion * Math.abs(motionDifference) / maxRotationDifference +
                    this._coefficients.panoSequencePenalty * (potential.sameSequence ? 0 : 1) +
                    this._coefficients.panoMergeCCPenalty * (potential.sameMergeCC ? 0 : 1);

                if (score < lowestScore) {
                    lowestScore = score;
                    edge = potential;
                }
            }

            if (edge != null) {
                occupiedAngles.push(edge.motionChange);
                panoEdges.push({
                    data: {
                        direction: EdgeDirection.Pano,
                        worldMotionAzimuth: edge.worldMotionAzimuth,
                    },
                    from: node.key,
                    to: edge.key,
                });
            } else {
                stepAngles.push(rotation);
            }
        }

        let occupiedStepAngles: {[direction: string]: number[] } = {};
        occupiedStepAngles[EdgeDirection.Pano] = occupiedAngles;
        occupiedStepAngles[EdgeDirection.StepForward] = [];
        occupiedStepAngles[EdgeDirection.StepLeft] = [];
        occupiedStepAngles[EdgeDirection.StepBackward] = [];
        occupiedStepAngles[EdgeDirection.StepRight] = [];

        for (let stepAngle of stepAngles) {
            let occupations: [EdgeDirection, IPotentialEdge][] = [];

            for (let k in this._directions.panos) {
                if (!this._directions.panos.hasOwnProperty(k)) {
                    continue;
                }

                let pano: IPano = this._directions.panos[k];

                let allOccupiedAngles: number[] = occupiedStepAngles[EdgeDirection.Pano]
                    .concat(occupiedStepAngles[pano.direction])
                    .concat(occupiedStepAngles[pano.prev])
                    .concat(occupiedStepAngles[pano.next]);

                let lowestScore: number = Number.MAX_VALUE;
                let edge: [EdgeDirection, IPotentialEdge] = null;

                for (let potential of potentialSteps) {
                    if (potential[0] !== pano.direction) {
                        continue;
                    }

                    let motionChange: number = this._spatial.angleDifference(stepAngle, potential[1].motionChange);

                    if (Math.abs(motionChange) > maxRotationDifference) {
                        continue;
                    }

                    let minOccupiedDifference: number = Number.MAX_VALUE;
                    for (let occupiedAngle of allOccupiedAngles) {
                        let occupiedDifference: number =
                            Math.abs(this._spatial.angleDifference(occupiedAngle, potential[1].motionChange));

                        if (occupiedDifference < minOccupiedDifference) {
                            minOccupiedDifference = occupiedDifference;
                        }
                    }

                    if (minOccupiedDifference <= maxRotationDifference) {
                        continue;
                    }

                    let score: number = this._coefficients.panoPreferredDistance *
                        Math.abs(potential[1].distance - this._settings.panoPreferredDistance) /
                        this._settings.panoMaxDistance +
                        this._coefficients.panoMotion * Math.abs(motionChange) / maxRotationDifference +
                        this._coefficients.panoMergeCCPenalty * (potential[1].sameMergeCC ? 0 : 1);

                    if (score < lowestScore) {
                        lowestScore = score;
                        edge = potential;
                    }
                }

                if (edge != null) {
                    occupations.push(edge);
                    panoEdges.push({
                        data: {
                            direction: edge[0],
                            worldMotionAzimuth: edge[1].worldMotionAzimuth,
                        },
                        from: node.key,
                        to: edge[1].key,
                    });
                }
            }

            for (let occupation of occupations) {
                occupiedStepAngles[occupation[0]].push(occupation[1].motionChange);
            }
        }

        return panoEdges;
    }
}

export default EdgeCalculator;
