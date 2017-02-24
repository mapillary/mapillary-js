import {Subscription} from "rxjs/Subscription";

import {
    Component,
    IMouseConfiguration,
    MouseHandlerBase,
} from "../../Component";
import {
    ViewportCoords,
    Transform,
} from "../../Geo";
import {
    RenderCamera,
} from "../../Render";
import {
    ICurrentState,
    IFrame,
} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";

export class ScrollZoomHandler extends MouseHandlerBase<IMouseConfiguration> {
    private _preventDefaultSubscription: Subscription;
    private _zoomSubscription: Subscription;

    constructor(component: Component<IMouseConfiguration>, container: Container, navigator: Navigator, viewportCoords: ViewportCoords) {
        super(component, container, navigator, viewportCoords);

        this._preventDefaultSubscription = null;
        this._zoomSubscription = null;
    }

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

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let canvasX: number = event.clientX - clientRect.left;
                    let canvasY: number = event.clientY - clientRect.top;

                    let unprojected: THREE.Vector3 =
                        this._viewportCoords.unprojectFromCanvas(
                            canvasX,
                            canvasY,
                            offsetWidth,
                            offsetHeight,
                            render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    let deltaY: number = event.deltaY;
                    if (event.deltaMode === 1) {
                        deltaY = 40 * deltaY;
                    } else if (event.deltaMode === 2) {
                        deltaY = 800 * deltaY;
                    }

                    let zoom: number = -3 * deltaY / offsetHeight;

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
