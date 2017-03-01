/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/merge";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/withLatestFrom";

import {
    ComponentService,
    Component,
    DragPanHandler,
    IMouseConfiguration,
    ScrollZoomHandler,
    TouchZoomHandler,
} from "../Component";
import {
    ViewportCoords,
    Spatial,
    Transform,
} from "../Geo";
import {
    IVNodeHash,
    RenderCamera,
} from "../Render";
import {
    Container,
    Navigator,
} from "../Viewer";

/**
 * @class MouseComponent
 * @classdesc Component handling mouse and touch events for camera movement.
 */
export class MouseComponent extends Component<IMouseConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "mouse";

    private _basicDistanceThreshold: number;
    private _basicRotationThreshold: number;
    private _bounceCoeff: number;

    private _viewportCoords: ViewportCoords;
    private _spatial: Spatial;

    private _dragPanHandler: DragPanHandler;
    private _scrollZoomHandler: ScrollZoomHandler;
    private _touchZoomHandler: TouchZoomHandler;

    private _bounceSubscription: Subscription;
    private _configurationSubscription: Subscription;
    private _cursorSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._basicDistanceThreshold = 1e-3;
        this._basicRotationThreshold = 5e-2;
        this._bounceCoeff = 1e-1;

        let spatial: Spatial = new Spatial();
        let viewportCoords: ViewportCoords = new ViewportCoords();

        this._spatial = spatial;
        this._viewportCoords = viewportCoords;

        this._dragPanHandler = new DragPanHandler(this, container, navigator, viewportCoords, spatial);
        this._scrollZoomHandler = new ScrollZoomHandler(this, container, navigator, viewportCoords);
        this._touchZoomHandler = new TouchZoomHandler(this, container, navigator, viewportCoords);
    }

    public get dragPan(): DragPanHandler {
        return this._dragPanHandler;
    }

    public get scrollZoom(): ScrollZoomHandler {
        return this._scrollZoomHandler;
    }

    public get touchZoom(): TouchZoomHandler {
        return this._touchZoomHandler;
    }

    protected _activate(): void {
        this._cursorSubscription = this._configuration$
            .map(
                (configuration: IMouseConfiguration): IVNodeHash => {
                    let tagName: string = configuration.dragPan ? "div.MouseContainer" : "div";
                    let vNode: vd.VNode = vd.h(tagName, {}, []);

                    return { name: this._name, vnode: vNode };
                })
            .subscribe(this._container.domRenderer.render$);

        this._configurationSubscription = this._configuration$
            .subscribe(
                (configuration: IMouseConfiguration): void => {
                    if (configuration.scrollZoom) {
                        this._scrollZoomHandler.enable();
                    } else {
                        this._scrollZoomHandler.disable();
                    }

                    if (configuration.dragPan) {
                        this._dragPanHandler.enable();
                    } else {
                        this._dragPanHandler.disable();
                    }

                    if (configuration.touchZoom) {
                        this._touchZoomHandler.enable();
                    } else {
                        this._touchZoomHandler.disable();
                    }
                });

        this._bounceSubscription = Observable
            .combineLatest(
                this._navigator.stateService.inTranslation$,
                this._container.mouseService.active$,
                this._container.touchService.active$)
            .map(
                (noForce: boolean[]): boolean => {
                    return noForce[0] || noForce[1] || noForce[2];
                })
            .distinctUntilChanged()
            .switchMap(
                (noForce: boolean): Observable<[RenderCamera, Transform]> => {
                    return noForce ?
                        Observable.empty() :
                        Observable.combineLatest(
                            this._container.renderService.renderCamera$,
                            this._navigator.stateService.currentTransform$.first());
                })
            .subscribe(
                (args: [RenderCamera, Transform]): void => {
                    let renderCamera: RenderCamera = args[0];
                    let perspectiveCamera: THREE.PerspectiveCamera = renderCamera.perspective;
                    let transform: Transform = args[1];

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

        this._container.mouseService.claimMouse(this._name, 0);
    }

    protected _deactivate(): void {
        this._container.mouseService.unclaimMouse(this._name);

        this._bounceSubscription.unsubscribe();
        this._configurationSubscription.unsubscribe();
        this._cursorSubscription.unsubscribe();

        this._dragPanHandler.disable();
        this._scrollZoomHandler.disable();
        this._touchZoomHandler.disable();
    }

    protected _getDefaultConfiguration(): IMouseConfiguration {
        return { dragPan: true, scrollZoom: true, touchZoom: true };
    }
}

ComponentService.register(MouseComponent);
export default MouseComponent;
