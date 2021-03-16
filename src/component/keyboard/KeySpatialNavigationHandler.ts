import * as THREE from "three";

import {
    Observable,
    Subscription,
} from "rxjs";

import {
    withLatestFrom,
    switchMap,
} from "rxjs/operators";

import { Node } from "../../graph/Node";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { Component } from "../Component";
import { IKeyboardConfiguration } from "../interfaces/IKeyboardConfiguration";
import { HandlerBase } from "../utils/HandlerBase";
import { Spatial } from "../../geo/Spatial";
import { IEdge } from "../../graph/edge/interfaces/IEdge";
import { IEdgeStatus } from "../../graph/interfaces/IEdgeStatus";
import { IFrame } from "../../state/interfaces/IFrame";
import { IRotation } from "../../state/interfaces/IRotation";
import { Camera } from "../../geo/Camera";
import { EdgeDirection } from "../../graph/edge/EdgeDirection";
import { AbortMapillaryError } from "../../error/AbortMapillaryError";
import { isSpherical } from "../../geo/Geo";


/**
 * The `KeySpatialNavigationHandler` allows the user to navigate through a sequence using the
 * following key commands:
 *
 * `Up Arrow`: Step forward.
 * `Down Arrow`: Step backward.
 * `Left Arrow`: Step to the left.
 * `Rigth Arrow`: Step to the right.
 * `SHIFT` + `Down Arrow`: Turn around.
 * `SHIFT` + `Left Arrow`: Turn to the left.
 * `SHIFT` + `Rigth Arrow`: Turn to the right.
 *
 * @example
 * ```
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keySpatialNavigation.disable();
 * keyboardComponent.keySpatialNavigation.enable();
 *
 * var isEnabled = keyboardComponent.keySpatialNavigation.isEnabled;
 * ```
 */
export class KeySpatialNavigationHandler extends HandlerBase<IKeyboardConfiguration> {
    private _spatial: Spatial;

    private _keyDownSubscription: Subscription;

    /** @ignore */
    constructor(
        component: Component<IKeyboardConfiguration>,
        container: Container,
        navigator: Navigator,
        spatial: Spatial) {
        super(component, container, navigator);

        this._spatial = spatial;
    }

    protected _enable(): void {
        const spatialEdges$: Observable<IEdgeStatus> = this._navigator.stateService.currentNode$.pipe(
            switchMap(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.spatialEdges$;
                }));

        this._keyDownSubscription = this._container.keyboardService.keyDown$.pipe(
            withLatestFrom(
                spatialEdges$,
                this._navigator.stateService.currentState$))
            .subscribe(([event, edgeStatus, frame]: [KeyboardEvent, IEdgeStatus, IFrame]): void => {
                let spherical = isSpherical(frame.state.currentNode.cameraType);
                let direction: EdgeDirection = null;
                switch (event.keyCode) {
                    case 37: // left
                        direction = event.shiftKey && !spherical ? EdgeDirection.TurnLeft : EdgeDirection.StepLeft;
                        break;
                    case 38: // up
                        direction = event.shiftKey && !spherical ? EdgeDirection.Spherical : EdgeDirection.StepForward;
                        break;
                    case 39: // right
                        direction = event.shiftKey && !spherical ? EdgeDirection.TurnRight : EdgeDirection.StepRight;
                        break;
                    case 40: // down
                        direction = event.shiftKey && !spherical ? EdgeDirection.TurnU : EdgeDirection.StepBackward;
                        break;
                    default:
                        return;
                }

                event.preventDefault();

                if (event.altKey || !edgeStatus.cached ||
                    (event.shiftKey && spherical)) {
                    return;
                }

                if (!spherical) {
                    this._moveDir(direction, edgeStatus);
                } else {
                    const shifts: { [dir: number]: number } = {};

                    shifts[EdgeDirection.StepBackward] = Math.PI;
                    shifts[EdgeDirection.StepForward] = 0;
                    shifts[EdgeDirection.StepLeft] = Math.PI / 2;
                    shifts[EdgeDirection.StepRight] = -Math.PI / 2;

                    const phi: number = this._rotationFromCamera(frame.state.camera).phi;
                    const navigationAngle: number = this._spatial.wrapAngle(phi + shifts[direction]);
                    const threshold: number = Math.PI / 4;
                    const edges: IEdge[] = edgeStatus.edges.filter(
                        (e: IEdge): boolean => {
                            return e.data.direction === EdgeDirection.Spherical || e.data.direction === direction;
                        });

                    let smallestAngle: number = Number.MAX_VALUE;
                    let toKey: string = null;
                    for (const edge of edges) {
                        const angle: number = Math.abs(this._spatial.wrapAngle(edge.data.worldMotionAzimuth - navigationAngle));

                        if (angle < Math.min(smallestAngle, threshold)) {
                            smallestAngle = angle;
                            toKey = edge.to;
                        }
                    }

                    if (toKey == null) {
                        return;
                    }

                    this._moveToKey(toKey);
                }
            });
    }

    protected _disable(): void {
        this._keyDownSubscription.unsubscribe();
    }

    protected _getConfiguration(enable: boolean): IKeyboardConfiguration {
        return { keySpatialNavigation: enable };
    }

    private _moveDir(direction: EdgeDirection, edgeStatus: IEdgeStatus): void {
        for (const edge of edgeStatus.edges) {
            if (edge.data.direction === direction) {
                this._moveToKey(edge.to);
                return;
            }
        }
    }

    private _moveToKey(key: string): void {
        this._navigator.moveToKey$(key)
            .subscribe(
                undefined,
                (error: Error): void => {
                    if (!(error instanceof AbortMapillaryError)) {
                        console.error(error);
                    }
                });
    }

    private _rotationFromCamera(camera: Camera): IRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        let upProjection: number = direction.clone().dot(camera.up);
        let planeProjection: THREE.Vector3 = direction.clone().sub(camera.up.clone().multiplyScalar(upProjection));

        let phi: number = Math.atan2(planeProjection.y, planeProjection.x);
        let theta: number = Math.PI / 2 - this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }
}
