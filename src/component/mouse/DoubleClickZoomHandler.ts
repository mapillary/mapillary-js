import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    IMouseConfiguration,
    MouseHandlerBase,
} from "../../Component";
import {Transform} from "../../Geo";
import {RenderCamera} from "../../Render";

type ClientTouch = {
    clientX: number;
    clientY: number;
    shiftKey: boolean;
}

export class DoubleClickZoomHandler extends MouseHandlerBase<IMouseConfiguration> {
    private _zoomSubscription: Subscription;

    protected _enable(): void {
        this._zoomSubscription = Observable
            .merge(
                this._container.mouseService
                    .filtered$(this._component.name, this._container.mouseService.dblClick$),
                this._container.touchService.doubleTap$
                    .map(
                        (e: TouchEvent): ClientTouch => {
                            let touch: Touch = e.touches[0];
                            return { clientX: touch.clientX, clientY: touch.clientY, shiftKey: e.shiftKey };
                        }))
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
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
