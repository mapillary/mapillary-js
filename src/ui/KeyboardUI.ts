/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />

import * as rx from "rx";
import * as _ from "underscore";

import {EdgeDirection, IEdge} from "../Edge";
import {UI} from "../UI";
import {Container, Navigator} from "../Viewer";
import {IFrame, IRotation} from "../State";
import {Node} from "../Graph";
import {Spatial, Camera} from "../Geo";

interface IKeyboardFrame {
    event: KeyboardEvent;
    frame: IFrame;
}

export class KeyboardUI extends UI {
    public static uiName: string = "keyboard";

    private _spatial: Spatial;

    private _disposable: rx.IDisposable;
    private _perspectiveDirections: EdgeDirection[];

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();

        this._perspectiveDirections = [
            EdgeDirection.STEP_FORWARD,
            EdgeDirection.STEP_BACKWARD,
            EdgeDirection.STEP_LEFT,
            EdgeDirection.STEP_RIGHT,
            EdgeDirection.TURN_LEFT,
            EdgeDirection.TURN_RIGHT,
            EdgeDirection.TURN_U,
        ];
    }

    protected _activate(): void {
        this._disposable = rx.Observable
            .fromEvent(document, "keydown")
            .withLatestFrom(
                this._navigator.stateService.currentState$,
                (event: KeyboardEvent, frame: IFrame): IKeyboardFrame => {
                    return { event: event, frame: frame };
                })
            .subscribe((kf: IKeyboardFrame): void => {
                if (!kf.frame.state.currentNode.pano) {
                    this._navigatePerspective(kf.event, kf.frame.state.currentNode);
                } else {
                    this._navigatePanorama(kf.event, kf.frame.state.currentNode, kf.frame.state.camera);
                }
            });
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private _navigatePanorama(event: KeyboardEvent, node: Node, camera: Camera): void {
        let navigationAngle: number = 0;
        let stepDirection: EdgeDirection = null;

        let phi: number = this._rotationFromCamera(camera).phi;

        switch (event.keyCode) {
            case 37: // left
                navigationAngle = Math.PI / 2 + phi;
                stepDirection = EdgeDirection.STEP_LEFT;
                break;
            case 38: // up
                navigationAngle = phi;
                stepDirection = EdgeDirection.STEP_FORWARD;
                break;
            case 39: // right
                navigationAngle = -Math.PI / 2 + phi;
                stepDirection = EdgeDirection.STEP_RIGHT;
                break;
            case 40: // down
                navigationAngle = Math.PI + phi;
                stepDirection = EdgeDirection.STEP_BACKWARD;
                break;
            default:
                return;
        }

        navigationAngle = this._spatial.wrapAngle(navigationAngle);

        let threshold: number = Math.PI / 4;

        let edges: IEdge[] = node.edges.filter(
            (e: IEdge): boolean => {
                return e.data.direction === EdgeDirection.PANO ||
                    e.data.direction === stepDirection;
            });

        let smallestAngle: number = Number.MAX_VALUE;
        let toKey: string = null;

        for (let edge of edges) {
            let angle: number = Math.abs(this._spatial.wrapAngle(edge.data.worldMotionAzimuth - navigationAngle));

            if (angle < Math.min(smallestAngle, threshold)) {
                smallestAngle = angle;
                toKey = edge.to;
            }
        }

        if (toKey == null) {
            return;
        }

        this._navigator.moveToKey(toKey).subscribe();
    }

    private _rotationFromCamera(camera: Camera): IRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        let upProjection: number = direction.clone().dot(camera.up);
        let planeProjection: THREE.Vector3 = direction.clone().sub(camera.up.clone().multiplyScalar(upProjection));

        let phi: number = Math.atan2(planeProjection.y, planeProjection.x);
        let theta: number = Math.PI / 2 - this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }

    private _navigatePerspective(event: KeyboardEvent, node: Node): void {
        let direction: EdgeDirection = null;

        switch (event.keyCode) {
            case 37: // left
                direction = event.shiftKey ? EdgeDirection.TURN_LEFT : EdgeDirection.STEP_LEFT;
                break;
            case 38: // up
                direction = EdgeDirection.STEP_FORWARD;
                break;
            case 39: // right
                direction = event.shiftKey ? EdgeDirection.TURN_RIGHT : EdgeDirection.STEP_RIGHT;
                break;
            case 40: // down
                direction = event.shiftKey ? EdgeDirection.TURN_U : EdgeDirection.STEP_BACKWARD;
                break;
            default:
                break;
        }

        direction = this._checkExistence(direction, node);

        if (direction == null) {
            return;
        }

        this._navigator.moveDir(direction).subscribe();
    }

    private _checkExistence(direction: EdgeDirection, node: Node): EdgeDirection {
        if (direction == null) {
            return null;
        }

        let directionExist: boolean = _.any(
            node.edges,
            (e: IEdge): boolean => {
                return e.data.direction === direction;
            });

        if (direction === EdgeDirection.STEP_FORWARD ||
            direction === EdgeDirection.STEP_BACKWARD) {
            if (directionExist) {
                return direction;
            } else {
                return this._fallbackToSequence(direction, node);
            }
        } else {
            return directionExist ? direction : null;
        }
    }

    private _fallbackToSequence(direction: EdgeDirection, node: Node): EdgeDirection {
        let sequenceDirection: EdgeDirection = null;

        switch (direction) {
            case EdgeDirection.STEP_FORWARD:
                sequenceDirection = EdgeDirection.NEXT;
                break;
            case EdgeDirection.STEP_BACKWARD:
                sequenceDirection = EdgeDirection.PREV;
                break;
            default:
                break;
        }

        if (sequenceDirection == null) {
            return null;
        }

        let sequenceEdge: IEdge = _.find(
            node.edges,
            (e: IEdge): boolean => {
                return e.data.direction === sequenceDirection;
            });

        if (sequenceEdge == null) {
            return null;
        }

        let perspectiveEdges: IEdge[] = node.edges.filter(
            (e: IEdge): boolean => {
                return this._perspectiveDirections.indexOf(e.data.direction) > -1;
            });

        for (let edge of perspectiveEdges) {
            if (edge.to === sequenceEdge.to) {
                return null;
            }
        }

        return sequenceDirection;
    }
}

export default KeyboardUI;
