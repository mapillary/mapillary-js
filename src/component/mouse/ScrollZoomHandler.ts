import {Subscription} from "rxjs/Subscription";

import {
    Component,
    IMouseConfiguration,
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

export class ScrollZoomHandler {
    private _component: Component<IMouseConfiguration>;
    private _container: Container;
    private _navigator: Navigator;
    private _viewportCoords: ViewportCoords;

    private _enabled: boolean;

    private _preventDefaultSubscription: Subscription;
    private _zoomSubscription: Subscription;

    constructor(component: Component<IMouseConfiguration>, container: Container, navigator: Navigator, viewportCoords: ViewportCoords) {
        this._component = component;
        this._container = container;
        this._navigator = navigator;
        this._viewportCoords = viewportCoords;

        this._enabled = false;

        this._preventDefaultSubscription = null;
        this._zoomSubscription = null;
    }

    public get isEnabled(): boolean {
        return this._enabled;
    }

    public enable(): void {
        if (this._enabled || !this._component.activated) { return; }

        this._subscribe();
        this._enabled = true;

        this._component.configure({ scrollZoom: true });
    }

    public disable(): void {
        if (!this._enabled) { return; }

        this._unsubscribe();
        this._enabled = false;

        if (this._component.activated) {
            this._component.configure({ scrollZoom: false });
        }
    }

    private _subscribe(): void {
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

    private _unsubscribe(): void {
        this._preventDefaultSubscription.unsubscribe();
        this._zoomSubscription.unsubscribe();

        this._preventDefaultSubscription = null;
        this._zoomSubscription = null;
    }
}

export default ScrollZoomHandler;
