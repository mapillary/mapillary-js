import * as THREE from "three";

import {empty as observableEmpty, combineLatest as observableCombineLatest, Observable, Subscription} from "rxjs";

import {first, map, distinctUntilChanged, switchMap, withLatestFrom, startWith} from "rxjs/operators";

import {
    Component,
    ImageBoundary,
    IMouseConfiguration,
    HandlerBase,
} from "../../Component";
import {
    Spatial,
    Transform,
    ViewportCoords,
} from "../../Geo";
import {
    RenderCamera,
} from "../../Render";
import {IFrame} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";
import Node from "../../graph/Node";

/**
 * The `BounceHandler` ensures that the viewer bounces back to the image
 * when drag panning outside of the image edge.
 */
export class BounceHandler extends HandlerBase<IMouseConfiguration> {
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    private _bounceSubscription: Subscription;

    constructor(
        component: Component<IMouseConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords,
        spatial: Spatial) {
        super(component, container, navigator);

        this._spatial = spatial;
        this._viewportCoords = viewportCoords;
    }

    protected _enable(): void {
        const inTransition$: Observable<boolean> = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: IFrame): boolean => {
                    return frame.state.alpha < 1;
                }),
            distinctUntilChanged());

        this._bounceSubscription = observableCombineLatest(
                inTransition$,
                this._navigator.stateService.inTranslation$,
                this._container.mouseService.active$,
                this._container.touchService.active$).pipe(
            map(
                (noForce: boolean[]): boolean => {
                    return noForce[0] || noForce[1] || noForce[2] || noForce[3];
                }),
            distinctUntilChanged(),
            switchMap(
                (noForce: boolean): Observable<[RenderCamera, Transform]> => {
                    return noForce ?
                        observableEmpty() :
                        observableCombineLatest(
                            this._container.renderService.renderCamera$,
                            this._navigator.stateService.currentTransform$.pipe(first()));
                }),
            withLatestFrom(this._navigator.panService.panNodes$))
            .subscribe(
                ([[render, transform], nts]: [[RenderCamera, Transform], [Node, Transform, number][]]): void => {
                    if (!transform.hasValidScale && render.camera.focal < 0.1) {
                        return;
                    }

                    if (render.perspective.aspect === 0 || render.perspective.aspect === Number.POSITIVE_INFINITY) {
                        return;
                    }

                    const distances: number[] = ImageBoundary.viewportDistances(transform, render.perspective, this._viewportCoords);

                    const basic: number[] = this._viewportCoords.viewportToBasic(0, 0, transform, render.perspective);

                    if ((basic[0] < 0 || basic[0] > 1) && nts.length > 0) {
                        distances[0] = distances[2] = 0;
                    }

                    for (const [, t] of nts) {
                        const d: number[] = ImageBoundary.viewportDistances(t, render.perspective, this._viewportCoords);

                        for (let i: number = 1; i < distances.length; i += 2) {
                            if (d[i] < distances[i]) {
                                distances[i] = d[i];
                            }
                        }
                    }

                    if (Math.max(...distances) < 0.01) {
                        return;
                    }

                    const horizontalDistance: number = distances[1] - distances[3];
                    const verticalDistance: number = distances[0] - distances[2];

                    const currentDirection: THREE.Vector3 = this._viewportCoords
                        .unprojectFromViewport(0, 0, render.perspective)
                        .sub(render.perspective.position);

                    const directionPhi: THREE.Vector3 = this._viewportCoords
                            .unprojectFromViewport(horizontalDistance, 0, render.perspective)
                            .sub(render.perspective.position);

                    const directionTheta: THREE.Vector3 = this._viewportCoords
                        .unprojectFromViewport(0, verticalDistance, render.perspective)
                        .sub(render.perspective.position);

                    let phi: number = (horizontalDistance > 0 ? 1 : -1) * directionPhi.angleTo(currentDirection);
                    let theta: number = (verticalDistance > 0 ? 1 : -1) * directionTheta.angleTo(currentDirection);

                    const threshold: number = Math.PI / 60;
                    const coeff: number = 1e-1;

                    phi = this._spatial.clamp(coeff * phi, -threshold, threshold);
                    theta = this._spatial.clamp(coeff * theta, -threshold, threshold);

                    this._navigator.stateService.rotateUnbounded({ phi: phi, theta: theta });
                });
    }

    protected _disable(): void {
        this._bounceSubscription.unsubscribe();
    }

    protected _getConfiguration(): IMouseConfiguration {
        return { };
    }
}

export default BounceHandler;
