import * as THREE from "three";

import { EdgeCalculatorCoefficients } from "./EdgeCalculatorCoefficients";
import { EdgeCalculatorDirections } from "./EdgeCalculatorDirections";
import { EdgeCalculatorSettings } from "./EdgeCalculatorSettings";
import { NavigationDirection } from "./NavigationDirection";
import { NavigationEdge } from "./interfaces/NavigationEdge";
import { PotentialEdge } from "./interfaces/PotentialEdge";
import { StepDirection } from "./interfaces/StepDirection";
import { TurnDirection } from "./interfaces/TurnDirection";

import { Image } from "../Image";
import { Sequence } from "../Sequence";

import { ArgumentMapillaryError } from "../../error/ArgumentMapillaryError";
import { Spatial } from "../../geo/Spatial";
import { isSpherical } from "../../geo/Geo";
import { geodeticToEnu } from "../../geo/GeoCoords";

/**
 * @class EdgeCalculator
 *
 * @classdesc Represents a class for calculating node edges.
 */
export class EdgeCalculator {

    private _spatial: Spatial;

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

        this._settings = settings != null ? settings : new EdgeCalculatorSettings();
        this._directions = directions != null ? directions : new EdgeCalculatorDirections();
        this._coefficients = coefficients != null ? coefficients : new EdgeCalculatorCoefficients();
    }

    /**
     * Returns the potential edges to destination nodes for a set
     * of nodes with respect to a source node.
     *
     * @param {Image} node - Source node.
     * @param {Array<Image>} nodes - Potential destination nodes.
     * @param {Array<string>} fallbackIds - Ids for destination nodes
     * that should be returned even if they do not meet the
     * criteria for a potential edge.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public getPotentialEdges(node: Image, potentialImages: Image[], fallbackIds: string[]): PotentialEdge[] {
        if (!node.complete) {
            throw new ArgumentMapillaryError("Image has to be full.");
        }

        if (!node.merged) {
            return [];
        }

        let currentDirection: THREE.Vector3 =
            this._spatial.viewingDirection(node.rotation);
        let currentVerticalDirection: number =
            this._spatial.angleToPlane(currentDirection.toArray(), [0, 0, 1]);

        let potentialEdges: PotentialEdge[] = [];

        for (let potential of potentialImages) {
            if (!potential.merged ||
                potential.id === node.id) {
                continue;
            }

            let enu = geodeticToEnu(
                potential.lngLat.lng,
                potential.lngLat.lat,
                potential.computedAltitude,
                node.lngLat.lng,
                node.lngLat.lat,
                node.computedAltitude);

            let motion: THREE.Vector3 = new THREE.Vector3(enu[0], enu[1], enu[2]);
            let distance: number = motion.length();

            if (distance > this._settings.maxDistance &&
                fallbackIds.indexOf(potential.id) < 0) {
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

            let sameSequence: boolean = potential.sequenceId != null &&
                node.sequenceId != null &&
                potential.sequenceId === node.sequenceId;

            let sameMergeCC: boolean =
                potential.mergeId === node.mergeId;

            let sameUser: boolean =
                potential.creatorId === node.creatorId;

            let potentialEdge: PotentialEdge = {
                capturedAt: potential.capturedAt,
                directionChange: directionChange,
                distance: distance,
                spherical: isSpherical(potential.cameraType),
                id: potential.id,
                motionChange: motionChange,
                rotation: rotation,
                sameMergeCC: sameMergeCC,
                sameSequence: sameSequence,
                sameUser: sameUser,
                sequenceId: potential.sequenceId,
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
     * @param {Image} node - Source node.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeSequenceEdges(node: Image, sequence: Sequence): NavigationEdge[] {
        if (!node.complete) {
            throw new ArgumentMapillaryError("Image has to be full.");
        }

        if (node.sequenceId !== sequence.id) {
            throw new ArgumentMapillaryError("Image and sequence does not correspond.");
        }

        let edges: NavigationEdge[] = [];

        let nextId: string = sequence.findNext(node.id);
        if (nextId != null) {
            edges.push({
                data: {
                    direction: NavigationDirection.Next,
                    worldMotionAzimuth: Number.NaN,
                },
                source: node.id,
                target: nextId,
            });
        }

        let prevId: string = sequence.findPrev(node.id);
        if (prevId != null) {
            edges.push({
                data: {
                    direction: NavigationDirection.Prev,
                    worldMotionAzimuth: Number.NaN,
                },
                source: node.id,
                target: prevId,
            });
        }

        return edges;
    }

    /**
     * Computes the similar edges for a node.
     *
     * @description Similar edges for perspective images
     * look roughly in the same direction and are positioned closed to the node.
     * Similar edges for spherical only target other spherical.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeSimilarEdges(node: Image, potentialEdges: PotentialEdge[]): NavigationEdge[] {
        if (!node.complete) {
            throw new ArgumentMapillaryError("Image has to be full.");
        }

        let nodeSpherical: boolean = isSpherical(node.cameraType);
        let sequenceGroups: { [key: string]: PotentialEdge[] } = {};

        for (let potentialEdge of potentialEdges) {
            if (potentialEdge.sequenceId == null) {
                continue;
            }

            if (potentialEdge.sameSequence) {
                continue;
            }

            if (nodeSpherical) {
                if (!potentialEdge.spherical) {
                    continue;
                }
            } else {
                if (!potentialEdge.spherical &&
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

            if (sequenceGroups[potentialEdge.sequenceId] == null) {
                sequenceGroups[potentialEdge.sequenceId] = [];
            }

            sequenceGroups[potentialEdge.sequenceId].push(potentialEdge);

        }

        let similarEdges: PotentialEdge[] = [];

        let calculateScore =
            isSpherical(node.cameraType) ?
                (potentialEdge: PotentialEdge): number => {
                    return potentialEdge.distance;
                } :
                (potentialEdge: PotentialEdge): number => {
                    return this._coefficients.similarDistance * potentialEdge.distance +
                        this._coefficients.similarRotation * potentialEdge.rotation;
                };

        for (let sequenceId in sequenceGroups) {
            if (!sequenceGroups.hasOwnProperty(sequenceId)) {
                continue;
            }

            let lowestScore: number = Number.MAX_VALUE;
            let similarEdge: PotentialEdge = null;

            for (let potentialEdge of sequenceGroups[sequenceId]) {
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
            .map<NavigationEdge>(
                (potentialEdge: PotentialEdge): NavigationEdge => {
                    return {
                        data: {
                            direction: NavigationDirection.Similar,
                            worldMotionAzimuth: potentialEdge.worldMotionAzimuth,
                        },
                        source: node.id,
                        target: potentialEdge.id,
                    };
                });
    }

    /**
     * Computes the step edges for a perspective node.
     *
     * @description Step edge targets can only be other perspective nodes.
     * Returns an empty array for spherical.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @param {string} prevId - Id of previous node in sequence.
     * @param {string} nextId - Id of next node in sequence.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeStepEdges(
        node: Image,
        potentialEdges: PotentialEdge[],
        prevId: string,
        nextId: string): NavigationEdge[] {

        if (!node.complete) {
            throw new ArgumentMapillaryError("Image has to be full.");
        }

        let edges: NavigationEdge[] = [];

        if (isSpherical(node.cameraType)) {
            return edges;
        }

        for (let k in this._directions.steps) {
            if (!this._directions.steps.hasOwnProperty(k)) {
                continue;
            }

            let step: StepDirection = this._directions.steps[k];

            let lowestScore: number = Number.MAX_VALUE;
            let edge: PotentialEdge = null;
            let fallback: PotentialEdge = null;

            for (let potential of potentialEdges) {
                if (potential.spherical) {
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

                let potentialId: string = potential.id;
                if (step.useFallback && (potentialId === prevId || potentialId === nextId)) {
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
                    source: node.id,
                    target: edge.id,
                });
            }
        }

        return edges;
    }

    /**
     * Computes the turn edges for a perspective node.
     *
     * @description Turn edge targets can only be other perspective images.
     * Returns an empty array for spherical.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeTurnEdges(node: Image, potentialEdges: PotentialEdge[]): NavigationEdge[] {
        if (!node.complete) {
            throw new ArgumentMapillaryError("Image has to be full.");
        }

        let edges: NavigationEdge[] = [];

        if (isSpherical(node.cameraType)) {
            return edges;
        }

        for (let k in this._directions.turns) {
            if (!this._directions.turns.hasOwnProperty(k)) {
                continue;
            }

            let turn: TurnDirection = this._directions.turns[k];

            let lowestScore: number = Number.MAX_VALUE;
            let edge: PotentialEdge = null;

            for (let potential of potentialEdges) {
                if (potential.spherical) {
                    continue;
                }

                if (potential.distance > this._settings.turnMaxDistance) {
                    continue;
                }

                let rig: boolean =
                    turn.direction !== NavigationDirection.TurnU &&
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
                    source: node.id,
                    target: edge.id,
                });
            }
        }

        return edges;
    }

    /**
     * Computes the spherical edges for a perspective node.
     *
     * @description Perspective to spherical edge targets can only be
     * spherical nodes. Returns an empty array for spherical.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computePerspectiveToSphericalEdges(node: Image, potentialEdges: PotentialEdge[]): NavigationEdge[] {
        if (!node.complete) {
            throw new ArgumentMapillaryError("Image has to be full.");
        }

        if (isSpherical(node.cameraType)) {
            return [];
        }

        let lowestScore: number = Number.MAX_VALUE;
        let edge: PotentialEdge = null;

        for (let potential of potentialEdges) {
            if (!potential.spherical) {
                continue;
            }

            let score: number =
                this._coefficients.sphericalPreferredDistance *
                Math.abs(potential.distance - this._settings.sphericalPreferredDistance) /
                this._settings.sphericalMaxDistance +
                this._coefficients.sphericalMotion * Math.abs(potential.motionChange) / Math.PI +
                this._coefficients.sphericalMergeCCPenalty * (potential.sameMergeCC ? 0 : 1);

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
                    direction: NavigationDirection.Spherical,
                    worldMotionAzimuth: edge.worldMotionAzimuth,
                },
                source: node.id,
                target: edge.id,
            },
        ];
    }

    /**
     * Computes the spherical and step edges for a spherical node.
     *
     * @description Spherical to spherical edge targets can only be
     * spherical nodes. spherical to step edge targets can only be perspective
     * nodes.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    public computeSphericalEdges(node: Image, potentialEdges: PotentialEdge[]): NavigationEdge[] {
        if (!node.complete) {
            throw new ArgumentMapillaryError("Image has to be full.");
        }

        if (!isSpherical(node.cameraType)) {
            return [];
        }

        let sphericalEdges: NavigationEdge[] = [];
        let potentialSpherical: PotentialEdge[] = [];
        let potentialSteps: [NavigationDirection, PotentialEdge][] = [];

        for (let potential of potentialEdges) {
            if (potential.distance > this._settings.sphericalMaxDistance) {
                continue;
            }

            if (potential.spherical) {
                if (potential.distance < this._settings.sphericalMinDistance) {
                    continue;
                }

                potentialSpherical.push(potential);
            } else {
                for (let k in this._directions.spherical) {
                    if (!this._directions.spherical.hasOwnProperty(k)) {
                        continue;
                    }

                    let spherical = this._directions.spherical[k];

                    let turn: number = this._spatial.angleDifference(
                        potential.directionChange,
                        potential.motionChange);

                    let turnChange: number = this._spatial.angleDifference(spherical.directionChange, turn);

                    if (Math.abs(turnChange) > this._settings.sphericalMaxStepTurnChange) {
                        continue;
                    }

                    potentialSteps.push([spherical.direction, potential]);

                    // break if step direction found
                    break;
                }
            }
        }

        let maxRotationDifference: number = Math.PI / this._settings.sphericalMaxItems;
        let occupiedAngles: number[] = [];
        let stepAngles: number[] = [];

        for (let index: number = 0; index < this._settings.sphericalMaxItems; index++) {
            let rotation: number = index / this._settings.sphericalMaxItems * 2 * Math.PI;

            let lowestScore: number = Number.MAX_VALUE;
            let edge: PotentialEdge = null;

            for (let potential of potentialSpherical) {
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
                    this._coefficients.sphericalPreferredDistance *
                    Math.abs(potential.distance - this._settings.sphericalPreferredDistance) /
                    this._settings.sphericalMaxDistance +
                    this._coefficients.sphericalMotion * Math.abs(motionDifference) / maxRotationDifference +
                    this._coefficients.sphericalSequencePenalty * (potential.sameSequence ? 0 : 1) +
                    this._coefficients.sphericalMergeCCPenalty * (potential.sameMergeCC ? 0 : 1);

                if (score < lowestScore) {
                    lowestScore = score;
                    edge = potential;
                }
            }

            if (edge != null) {
                occupiedAngles.push(edge.motionChange);
                sphericalEdges.push({
                    data: {
                        direction: NavigationDirection.Spherical,
                        worldMotionAzimuth: edge.worldMotionAzimuth,
                    },
                    source: node.id,
                    target: edge.id,
                });
            } else {
                stepAngles.push(rotation);
            }
        }

        let occupiedStepAngles: { [direction: string]: number[] } = {};
        occupiedStepAngles[NavigationDirection.Spherical] = occupiedAngles;
        occupiedStepAngles[NavigationDirection.StepForward] = [];
        occupiedStepAngles[NavigationDirection.StepLeft] = [];
        occupiedStepAngles[NavigationDirection.StepBackward] = [];
        occupiedStepAngles[NavigationDirection.StepRight] = [];

        for (let stepAngle of stepAngles) {
            let occupations: [NavigationDirection, PotentialEdge][] = [];

            for (let k in this._directions.spherical) {
                if (!this._directions.spherical.hasOwnProperty(k)) {
                    continue;
                }

                let spherical = this._directions.spherical[k];

                let allOccupiedAngles: number[] = occupiedStepAngles[NavigationDirection.Spherical]
                    .concat(occupiedStepAngles[spherical.direction])
                    .concat(occupiedStepAngles[spherical.prev])
                    .concat(occupiedStepAngles[spherical.next]);

                let lowestScore: number = Number.MAX_VALUE;
                let edge: [NavigationDirection, PotentialEdge] = null;

                for (let potential of potentialSteps) {
                    if (potential[0] !== spherical.direction) {
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

                    let score: number = this._coefficients.sphericalPreferredDistance *
                        Math.abs(potential[1].distance - this._settings.sphericalPreferredDistance) /
                        this._settings.sphericalMaxDistance +
                        this._coefficients.sphericalMotion * Math.abs(motionChange) / maxRotationDifference +
                        this._coefficients.sphericalMergeCCPenalty * (potential[1].sameMergeCC ? 0 : 1);

                    if (score < lowestScore) {
                        lowestScore = score;
                        edge = potential;
                    }
                }

                if (edge != null) {
                    occupations.push(edge);
                    sphericalEdges.push({
                        data: {
                            direction: edge[0],
                            worldMotionAzimuth: edge[1].worldMotionAzimuth,
                        },
                        source: node.id,
                        target: edge[1].id,
                    });
                }
            }

            for (let occupation of occupations) {
                occupiedStepAngles[occupation[0]].push(occupation[1].motionChange);
            }
        }

        return sphericalEdges;
    }
}
