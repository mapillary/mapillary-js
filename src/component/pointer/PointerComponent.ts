import { Component } from "../Component";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { Spatial } from "../../geo/Spatial";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { PointerConfiguration } from "../interfaces/PointerConfiguration";
import { BounceHandler } from "./BounceHandler";
import { DragPanHandler } from "./DragPanHandler";
import { EarthControlHandler } from "./EarthControlHandler";
import { ScrollZoomHandler } from "./ScrollZoomHandler";
import { TouchZoomHandler } from "./TouchZoomHandler";
import { ComponentName } from "../ComponentName";

/**
 * @class PointerComponent
 *
 * @classdesc Component handling mouse, pen, and touch events for camera movement.
 *
 * To retrive and use the mouse component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 *
 * var pointerComponent = viewer.getComponent("pointer");
 * ```
 */
export class PointerComponent extends Component<PointerConfiguration> {
    /** @inheritdoc */
    public static componentName: ComponentName = "pointer";

    private _bounceHandler: BounceHandler;
    private _dragPanHandler: DragPanHandler;
    private _earthControlHandler: EarthControlHandler;
    private _scrollZoomHandler: ScrollZoomHandler;
    private _touchZoomHandler: TouchZoomHandler;

    /** @ignore */
    constructor(
        name: string,
        container: Container,
        navigator: Navigator) {

        super(name, container, navigator);

        const spatial = new Spatial();
        const viewportCoords = new ViewportCoords();

        this._bounceHandler =
            new BounceHandler(
                this,
                container,
                navigator,
                viewportCoords,
                spatial);

        this._dragPanHandler =
            new DragPanHandler(
                this,
                container,
                navigator,
                viewportCoords,
                spatial);

        this._earthControlHandler =
            new EarthControlHandler(
                this,
                container,
                navigator,
                viewportCoords,
                spatial);

        this._scrollZoomHandler =
            new ScrollZoomHandler(
                this,
                container,
                navigator,
                viewportCoords);

        this._touchZoomHandler =
            new TouchZoomHandler(
                this,
                container,
                navigator,
                viewportCoords);
    }

    /**
     * Get drag pan.
     *
     * @returns {DragPanHandler} The drag pan handler.
     */
    public get dragPan(): DragPanHandler {
        return this._dragPanHandler;
    }

    /**
     * Get earth control.
     *
     * @returns {EarthControlHandler} The earth control handler.
     */
    public get earthControl(): EarthControlHandler {
        return this._earthControlHandler;
    }

    /**
     * Get scroll zoom.
     *
     * @returns {ScrollZoomHandler} The scroll zoom handler.
     */
    public get scrollZoom(): ScrollZoomHandler {
        return this._scrollZoomHandler;
    }

    /**
     * Get touch zoom.
     *
     * @returns {TouchZoomHandler} The touch zoom handler.
     */
    public get touchZoom(): TouchZoomHandler {
        return this._touchZoomHandler;
    }

    protected _activate(): void {
        this._bounceHandler.enable();

        this._subscriptions.push(this._configuration$
            .subscribe(
                (configuration: PointerConfiguration): void => {
                    if (configuration.dragPan) {
                        this._dragPanHandler.enable();
                    } else {
                        this._dragPanHandler.disable();
                    }

                    if (configuration.earthControl) {
                        this._earthControlHandler.enable();
                    } else {
                        this._earthControlHandler.disable();
                    }

                    if (configuration.scrollZoom) {
                        this._scrollZoomHandler.enable();
                    } else {
                        this._scrollZoomHandler.disable();
                    }

                    if (configuration.touchZoom) {
                        this._touchZoomHandler.enable();
                    } else {
                        this._touchZoomHandler.disable();
                    }
                }));

        this._container.mouseService.claimMouse(this._name, 0);
    }

    protected _deactivate(): void {
        this._container.mouseService.unclaimMouse(this._name);

        this._subscriptions.unsubscribe();

        this._bounceHandler.disable();
        this._dragPanHandler.disable();
        this._earthControlHandler.disable();
        this._scrollZoomHandler.disable();
        this._touchZoomHandler.disable();
    }

    protected _getDefaultConfiguration(): PointerConfiguration {
        return {
            dragPan: true,
            earthControl: true,
            scrollZoom: true,
            touchZoom: true,
        };
    }
}
