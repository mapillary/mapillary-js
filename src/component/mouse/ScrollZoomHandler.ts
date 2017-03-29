import {Subscription} from "rxjs/Subscription";

import {
    IMouseConfiguration,
    MouseHandlerBase,
} from "../../Component";
import {Transform} from "../../Geo";
import {RenderCamera} from "../../Render";
import {
    ICurrentState,
    IFrame,
} from "../../State";

/**
 * The `ScrollZoomHandler` allows the user to zoom the viewer photo by scrolling.
 *
 * @example
 * ```
 * var markerComponent = viewer.getComponent("marker");
 *
 * markerComponent.scrollZoom.disable();
 * markerComponent.scrollZoom.enable();
 *
 * var isEnabled = markerComponent.scrollZoom.isEnabled;
 * ```
 */
export class ScrollZoomHandler extends MouseHandlerBase<IMouseConfiguration> {
    private _preventDefaultSubscription: Subscription;
    private _zoomSubscription: Subscription;

    protected _enable(): void {
        this._preventDefaultSubscription = this._container.mouseService.mouseWheel$
            .subscribe(
                (event: WheelEvent): void => {
                    event.preventDefault();
                });

        this._zoomSubscription = this._container.mouseService
            .filtered$(this._component.name, this._container.mouseService.mouseWheel$)
            .withLatestFrom(
                this._navigator.stateService.currentState$,
                (w: WheelEvent, f: IFrame): [WheelEvent, IFrame] => {
                    return [w, f];
                })
            .filter(
                (args: [WheelEvent, IFrame]): boolean => {
                    let state: ICurrentState = args[1].state;
                    return state.currentNode.fullPano || state.nodesAhead < 1;
                })
            .map(
                (args: [WheelEvent, IFrame]): WheelEvent => {
                    return args[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (w: WheelEvent, r: RenderCamera, t: Transform): [WheelEvent, RenderCamera, Transform] => {
                    return [w, r, t];
                })
            .subscribe(
                (args: [WheelEvent, RenderCamera, Transform]): void => {
                    let event: WheelEvent = args[0];
                    let render: RenderCamera = args[1];
                    let transform: Transform = args[2];

                    let element: HTMLElement = this._container.element;

                    let [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);

                    let unprojected: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY,
                            element,
                            render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    let deltaY: number = event.deltaY;
                    if (event.deltaMode === 1) {
                        deltaY = 40 * deltaY;
                    } else if (event.deltaMode === 2) {
                        deltaY = 800 * deltaY;
                    }

                    const canvasSize: number[] = this._viewportCoords.containerToCanvas(element);

                    let zoom: number = -3 * deltaY / canvasSize[1];

                    this._navigator.stateService.zoomIn(zoom, reference);
                });
    }

    protected _disable(): void {
        this._preventDefaultSubscription.unsubscribe();
        this._zoomSubscription.unsubscribe();

        this._preventDefaultSubscription = null;
        this._zoomSubscription = null;
    }

    protected _getConfiguration(enable: boolean): IMouseConfiguration {
        return { scrollZoom: enable };
    }
}

export default ScrollZoomHandler;
