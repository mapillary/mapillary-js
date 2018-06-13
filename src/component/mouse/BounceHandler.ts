import {empty as observableEmpty, combineLatest as observableCombineLatest, Observable, Subscription} from "rxjs";

import {first, map, distinctUntilChanged, switchMap} from "rxjs/operators";

import {
    Component,
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

/**
 * The `BounceHandler` ensures that the viewer bounces back to the image
 * when drag panning outside of the image edge.
 */
export class BounceHandler extends HandlerBase<IMouseConfiguration> {
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    private _basicDistanceThreshold: number;
    private _basicRotationThreshold: number;
    private _bounceCoeff: number;

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

        this._basicDistanceThreshold = 1e-3;
        this._basicRotationThreshold = 5e-2;
        this._bounceCoeff = 1e-1;
    }

    protected _enable(): void {
        const inTransition$: Observable<boolean> = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: IFrame): boolean => {
                    return frame.state.alpha < 1;
                }));

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
                }))
            .subscribe(
                (args: [RenderCamera, Transform]): void => {
                    let renderCamera: RenderCamera = args[0];
                    let perspectiveCamera: THREE.PerspectiveCamera = renderCamera.perspective;
                    let transform: Transform = args[1];

                    if (!transform.hasValidScale && renderCamera.camera.focal < 0.1) {
                        return;
                    }

                    if (renderCamera.perspective.aspect === 0 || renderCamera.perspective.aspect === Number.POSITIVE_INFINITY) {
                        return;
                    }

                    let distanceThreshold: number = this._basicDistanceThreshold / Math.pow(2, renderCamera.zoom);
                    let basicCenter: number[] = this._viewportCoords.viewportToBasic(0, 0, transform, perspectiveCamera);

                    if (Math.abs(basicCenter[0] - 0.5) < distanceThreshold && Math.abs(basicCenter[1] - 0.5) < distanceThreshold) {
                        return;
                    }

                    let basicDistances: number[] = this._viewportCoords.getBasicDistances(transform, perspectiveCamera);
                    let basicX: number = 0;
                    let basicY: number = 0;

                    if (basicDistances[0] < distanceThreshold && basicDistances[1] < distanceThreshold &&
                        basicDistances[2] < distanceThreshold && basicDistances[3] < distanceThreshold) {
                        return;
                    }

                    if (Math.abs(basicDistances[0] - basicDistances[2]) < distanceThreshold &&
                        Math.abs(basicDistances[1] - basicDistances[3]) < distanceThreshold) {
                        return;
                    }

                    let coeff: number = this._bounceCoeff;

                    if (basicDistances[1] > 0 && basicDistances[3] === 0) {
                        basicX = -coeff * basicDistances[1];
                    } else if (basicDistances[1] === 0 && basicDistances[3] > 0) {
                        basicX = coeff * basicDistances[3];
                    } else if (basicDistances[1] > 0 && basicDistances[3] > 0) {
                        basicX = coeff * (basicDistances[3] - basicDistances[1]) / 2;
                    }

                    if (basicDistances[0] > 0 && basicDistances[2] === 0) {
                        basicY = coeff * basicDistances[0];
                    } else if (basicDistances[0] === 0 && basicDistances[2] > 0) {
                        basicY = -coeff * basicDistances[2];
                    } else if (basicDistances[0] > 0 && basicDistances[2] > 0) {
                        basicY = coeff * (basicDistances[0] - basicDistances[2]) / 2;
                    }

                    let rotationThreshold: number = this._basicRotationThreshold;

                    basicX = this._spatial.clamp(basicX, -rotationThreshold, rotationThreshold);
                    basicY = this._spatial.clamp(basicY, -rotationThreshold, rotationThreshold);

                    this._navigator.stateService.rotateBasicUnbounded([basicX, basicY]);
                });
    }

    protected _disable(): void {
        this._bounceSubscription.unsubscribe();
    }

    protected _getConfiguration(enable: boolean): IMouseConfiguration {
        return { };
    }
}

export default BounceHandler;
