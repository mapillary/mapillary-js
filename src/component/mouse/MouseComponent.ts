import { Subscription } from "rxjs";
import { Component } from "../Component";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { Spatial } from "../../geo/Spatial";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { IMouseConfiguration } from "../interfaces/IMouseConfiguration";
import { BounceHandler } from "./BounceHandler";
import { DragPanHandler } from "./DragPanHandler";
import { EarthControlHandler } from "./EarthControlHandler";
import { ScrollZoomHandler } from "./ScrollZoomHandler";
import { TouchZoomHandler } from "./TouchZoomHandler";

/**
 * @class MouseComponent
 *
 * @classdesc Component handling mouse and touch events for camera movement.
 *
 * To retrive and use the mouse component
 *
 * @example
 * ```
 * var viewer = new Mapillary.Viewer({ ... });
 *
 * var mouseComponent = viewer.getComponent("mouse");
 * ```
 */
export class MouseComponent extends Component<IMouseConfiguration> {
    /** @inheritdoc */
    public static componentName: string = "mouse";

    private _bounceHandler: BounceHandler;
    private _dragPanHandler: DragPanHandler;
    private _earthControlHandler: EarthControlHandler;
    private _scrollZoomHandler: ScrollZoomHandler;
    private _touchZoomHandler: TouchZoomHandler;

    private _configurationSubscription: Subscription;

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        const spatial: Spatial = new Spatial();
        const viewportCoords: ViewportCoords = new ViewportCoords();

        this._bounceHandler = new BounceHandler(this, container, navigator, viewportCoords, spatial);
        this._dragPanHandler = new DragPanHandler(this, container, navigator, viewportCoords, spatial);
        this._earthControlHandler = new EarthControlHandler(this, container, navigator, viewportCoords, spatial);
        this._scrollZoomHandler = new ScrollZoomHandler(this, container, navigator, viewportCoords);
        this._touchZoomHandler = new TouchZoomHandler(this, container, navigator, viewportCoords);
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
        this._earthControlHandler.enable();

        this._configurationSubscription = this._configuration$
            .subscribe(
                (configuration: IMouseConfiguration): void => {
                    if (configuration.dragPan) {
                        this._dragPanHandler.enable();
                    } else {
                        this._dragPanHandler.disable();
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
                });

        this._container.mouseService.claimMouse(this._name, 0);
    }

    protected _deactivate(): void {
        this._container.mouseService.unclaimMouse(this._name);

        this._configurationSubscription.unsubscribe();

        this._bounceHandler.disable();
        this._dragPanHandler.disable();
        this._earthControlHandler.disable();
        this._scrollZoomHandler.disable();
        this._touchZoomHandler.disable();
    }

    protected _getDefaultConfiguration(): IMouseConfiguration {
        return {
            dragPan: true,
            scrollZoom: true,
            touchZoom: true,
        };
    }
}
