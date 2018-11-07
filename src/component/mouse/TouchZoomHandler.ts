import {merge as observableMerge, Observable, Subscription} from "rxjs";

import {filter, withLatestFrom, map} from "rxjs/operators";
import * as THREE from "three";

import {
    Component,
    IMouseConfiguration,
    HandlerBase,
} from "../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../Geo";
import {RenderCamera} from "../../Render";
import {
    ICurrentState,
    IFrame,
} from "../../State";
import {
    Container,
    IPinch,
    Navigator,
} from "../../Viewer";

/**
 * The `TouchZoomHandler` allows the user to zoom the viewer image by pinching on a touchscreen.
 *
 * @example
 * ```
 * var mouseComponent = viewer.getComponent("mouse");
 *
 * mouseComponent.touchZoom.disable();
 * mouseComponent.touchZoom.enable();
 *
 * var isEnabled = mouseComponent.touchZoom.isEnabled;
 * ```
 */
export class TouchZoomHandler extends HandlerBase<IMouseConfiguration> {
    private _viewportCoords: ViewportCoords;

    private _activeSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _zoomSubscription: Subscription;

    /** @ignore */
    constructor(
        component: Component<IMouseConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords) {
        super(component, container, navigator);

        this._viewportCoords = viewportCoords;
    }

    protected _enable(): void {
        this._preventDefaultSubscription = this._container.touchService.pinch$
            .subscribe(
                (pinch: IPinch): void => {
                    pinch.originalEvent.preventDefault();
                });

        let pinchStarted$: Observable<boolean> =
            this._container.touchService.pinchStart$.pipe(
                map(
                    (event: TouchEvent): boolean => {
                        return true;
                    }));

        let pinchStopped$: Observable<boolean> =
            this._container.touchService.pinchEnd$.pipe(
                map(
                    (event: TouchEvent): boolean => {
                        return false;
                    }));

        this._activeSubscription = observableMerge(
                pinchStarted$,
                pinchStopped$)
            .subscribe(this._container.touchService.activate$);

        this._zoomSubscription = this._container.touchService.pinch$.pipe(
            withLatestFrom(this._navigator.stateService.currentState$),
            filter(
                (args: [IPinch, IFrame]): boolean => {
                    let state: ICurrentState = args[1].state;
                    return state.currentNode.fullPano || state.nodesAhead < 1;
                }),
            map(
                (args: [IPinch, IFrame]): IPinch => {
                    return args[0];
                }),
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$))
            .subscribe(
                ([pinch, render, transform]: [IPinch, RenderCamera, Transform]): void => {
                    let element: HTMLElement = this._container.element;

                    let [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(pinch, element);

                    let unprojected: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY,
                            element,
                            render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    const [canvasWidth, canvasHeight]: number[] = this._viewportCoords.containerToCanvas(element);
                    let zoom: number = 3 * pinch.distanceChange / Math.min(canvasWidth, canvasHeight);

                    this._navigator.stateService.zoomIn(zoom, reference);
                });
    }

    protected _disable(): void {
        this._activeSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._zoomSubscription.unsubscribe();

        this._preventDefaultSubscription = null;
        this._zoomSubscription = null;
    }

    protected _getConfiguration(enable: boolean): IMouseConfiguration {
        return { touchZoom: enable };
    }
}

export default TouchZoomHandler;
