/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {EdgeDirection, IEdge} from "../Edge";
import {UIService, UI} from "../UI";
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
                if (event.altKey) {
                    this._navigator.moveDir(EdgeDirection.NEXT).subscribe();
                    return;
                }

                navigationAngle = phi;
                stepDirection = EdgeDirection.STEP_FORWARD;
                break;
            case 39: // right
                navigationAngle = -Math.PI / 2 + phi;
                stepDirection = EdgeDirection.STEP_RIGHT;
                break;
            case 40: // down
                if (event.altKey) {
                    this._navigator.moveDir(EdgeDirection.PREV).subscribe();
                    return;
                }

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
                if (event.altKey) {
                    this._navigator.moveDir(EdgeDirection.NEXT).subscribe();
                    return;
                }

                direction = event.shiftKey ? EdgeDirection.PANO : EdgeDirection.STEP_FORWARD;
                break;
            case 39: // right
                direction = event.shiftKey ? EdgeDirection.TURN_RIGHT : EdgeDirection.STEP_RIGHT;
                break;
            case 40: // down
                if (event.altKey) {
                    this._navigator.moveDir(EdgeDirection.PREV).subscribe();
                    return;
                }

                direction = event.shiftKey ? EdgeDirection.TURN_U : EdgeDirection.STEP_BACKWARD;
                break;
            default:
                break;
        }

        if (direction == null) {
            return;
        }

        this._navigator.moveDir(direction).subscribe();
    }
}

UIService.register(KeyboardUI);
export default KeyboardUI;
