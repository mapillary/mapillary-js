import {merge as observableMerge, Subscription} from "rxjs";

import {map, withLatestFrom} from "rxjs/operators";

import {
    Component,
    IMouseConfiguration,
    HandlerBase,
    ClientTouch,
} from "../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../Geo";
import {RenderCamera} from "../../Render";
import {
    Container,
    Navigator,
} from "../../Viewer";

/**
 * The `DoubleClickZoomHandler` allows the user to zoom the viewer image at a point by double clicking.
 *
 * @example
 * ```
 * var mouseComponent = viewer.getComponent("mouse");
 *
 * mouseComponent.doubleClickZoom.disable();
 * mouseComponent.doubleClickZoom.enable();
 *
 * var isEnabled = mouseComponent.doubleClickZoom.isEnabled;
 * ```
 */
export class DoubleClickZoomHandler extends HandlerBase<IMouseConfiguration> {
    private _viewportCoords: ViewportCoords;

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
        this._zoomSubscription = observableMerge(
                this._container.mouseService
                    .filtered$(this._component.name, this._container.mouseService.dblClick$),
                this._container.touchService.doubleTap$.pipe(
                    map(
                        (e: TouchEvent): ClientTouch => {
                            let touch: Touch = e.touches[0];
                            return { clientX: touch.clientX, clientY: touch.clientY, shiftKey: e.shiftKey };
                        }))).pipe(
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$))
            .subscribe(
                ([event, render, transform]: [MouseEvent | ClientTouch, RenderCamera, Transform]): void => {
                    const element: HTMLElement = this._container.element;

                    const [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);

                    const unprojected: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY,
                            element,
                            render.perspective);

                    const reference: number[] = transform.projectBasic(unprojected.toArray());
                    const delta: number = !!(<{ shiftKey: boolean }>event).shiftKey ? -1 : 1;

                    this._navigator.stateService.zoomIn(delta, reference);
                });
    }

    protected _disable(): void {
        this._zoomSubscription.unsubscribe();
    }

    protected _getConfiguration(enable: boolean): IMouseConfiguration {
        return { doubleClickZoom: enable };
    }
}

export default DoubleClickZoomHandler;
