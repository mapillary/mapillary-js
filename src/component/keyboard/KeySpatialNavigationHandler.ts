import * as THREE from "three";

import {
    Observable,
    Subscription,
} from "rxjs";

import {
    withLatestFrom,
    switchMap,
} from "rxjs/operators";

import { Image } from "../../graph/Image";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { Component } from "../Component";
import { KeyboardConfiguration } from "../interfaces/KeyboardConfiguration";
import { HandlerBase } from "../util/HandlerBase";
import { Spatial } from "../../geo/Spatial";
import { NavigationEdge } from "../../graph/edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus } from "../../graph/interfaces/NavigationEdgeStatus";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { EulerRotation } from "../../state/interfaces/EulerRotation";
import { Camera } from "../../geo/Camera";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { CancelMapillaryError } from "../../error/CancelMapillaryError";
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
 * ```js
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keySpatialNavigation.disable();
 * keyboardComponent.keySpatialNavigation.enable();
 *
 * var isEnabled = keyboardComponent.keySpatialNavigation.isEnabled;
 * ```
 */
export class KeySpatialNavigationHandler extends HandlerBase<KeyboardConfiguration> {
    private _spatial: Spatial;

    private _keyDownSubscription: Subscription;

    /** @ignore */
    constructor(
        component: Component<KeyboardConfiguration>,
        container: Container,
        navigator: Navigator,
        spatial: Spatial) {
        super(component, container, navigator);

        this._spatial = spatial;
    }

    protected _enable(): void {
        const spatialEdges$: Observable<NavigationEdgeStatus> = this._navigator.stateService.currentImage$.pipe(
            switchMap(
                (image: Image): Observable<NavigationEdgeStatus> => {
                    return image.spatialEdges$;
                }));

        this._keyDownSubscription = this._container.keyboardService.keyDown$.pipe(
            withLatestFrom(
                spatialEdges$,
                this._navigator.stateService.currentState$))
            .subscribe(([event, edgeStatus, frame]: [KeyboardEvent, NavigationEdgeStatus, AnimationFrame]): void => {
                let spherical = isSpherical(frame.state.currentImage.cameraType);
                let direction: NavigationDirection = null;
                switch (event.keyCode) {
                    case 37: // left
                        direction = event.shiftKey && !spherical ? NavigationDirection.TurnLeft : NavigationDirection.StepLeft;
                        break;
                    case 38: // up
                        direction = event.shiftKey && !spherical ? NavigationDirection.Spherical : NavigationDirection.StepForward;
                        break;
                    case 39: // right
                        direction = event.shiftKey && !spherical ? NavigationDirection.TurnRight : NavigationDirection.StepRight;
                        break;
                    case 40: // down
                        direction = event.shiftKey && !spherical ? NavigationDirection.TurnU : NavigationDirection.StepBackward;
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

                    shifts[NavigationDirection.StepBackward] = Math.PI;
                    shifts[NavigationDirection.StepForward] = 0;
                    shifts[NavigationDirection.StepLeft] = Math.PI / 2;
                    shifts[NavigationDirection.StepRight] = -Math.PI / 2;

                    const phi: number = this._rotationFromCamera(frame.state.camera).phi;
                    const navigationAngle: number = this._spatial.wrapAngle(phi + shifts[direction]);
                    const threshold: number = Math.PI / 4;
                    const edges: NavigationEdge[] = edgeStatus.edges.filter(
                        (e: NavigationEdge): boolean => {
                            return e.data.direction === NavigationDirection.Spherical || e.data.direction === direction;
                        });

                    let smallestAngle: number = Number.MAX_VALUE;
                    let toKey: string = null;
                    for (const edge of edges) {
                        const angle: number = Math.abs(this._spatial.wrapAngle(edge.data.worldMotionAzimuth - navigationAngle));

                        if (angle < Math.min(smallestAngle, threshold)) {
                            smallestAngle = angle;
                            toKey = edge.target;
                        }
                    }

                    if (toKey == null) {
                        return;
                    }

                    this._moveTo(toKey);
                }
            });
    }

    protected _disable(): void {
        this._keyDownSubscription.unsubscribe();
    }

    protected _getConfiguration(enable: boolean): KeyboardConfiguration {
        return { keySpatialNavigation: enable };
    }

    private _moveDir(direction: NavigationDirection, edgeStatus: NavigationEdgeStatus): void {
        for (const edge of edgeStatus.edges) {
            if (edge.data.direction === direction) {
                this._moveTo(edge.target);
                return;
            }
        }
    }

    private _moveTo(id: string): void {
        this._navigator.moveTo$(id)
            .subscribe(
                undefined,
                (error: Error): void => {
                    if (!(error instanceof CancelMapillaryError)) {
                        console.error(error);
                    }
                });
    }

    private _rotationFromCamera(camera: Camera): EulerRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        let upProjection: number = direction.clone().dot(camera.up);
        let planeProjection: THREE.Vector3 = direction.clone().sub(camera.up.clone().multiplyScalar(upProjection));

        let phi: number = Math.atan2(planeProjection.y, planeProjection.x);
        let theta: number = Math.PI / 2 - this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }
}
