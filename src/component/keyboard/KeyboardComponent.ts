import { Subscription } from "rxjs";

import { Component } from "../Component";

import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { Spatial } from "../../geo/Spatial";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { IKeyboardConfiguration } from "../interfaces/IKeyboardConfiguration";
import { KeySequenceNavigationHandler } from "./KeySequenceNavigationHandler";
import { KeySpatialNavigationHandler } from "./KeySpatialNavigationHandler";
import { KeyZoomHandler } from "./KeyZoomHandler";
import { KeyPlayHandler } from "./KeyPlayHandler";

/**
 * @class KeyboardComponent
 *
 * @classdesc Component for keyboard event handling.
 *
 * To retrive and use the keyboard component
 *
 * @example
 * ```
 * var viewer = new Mapillary.Viewer({ ... });
 *
 * var keyboardComponent = viewer.getComponent("keyboard");
 * ```
 */
export class KeyboardComponent extends Component<IKeyboardConfiguration> {
    public static componentName: string = "keyboard";

    private _keyPlayHandler: KeyPlayHandler;
    private _keySequenceNavigationHandler: KeySequenceNavigationHandler;
    private _keySpatialNavigationHandler: KeySpatialNavigationHandler;
    private _keyZoomHandler: KeyZoomHandler;

    private _configurationSubscription: Subscription;

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._keyPlayHandler = new KeyPlayHandler(this, container, navigator);
        this._keySequenceNavigationHandler = new KeySequenceNavigationHandler(this, container, navigator);
        this._keySpatialNavigationHandler = new KeySpatialNavigationHandler(this, container, navigator, new Spatial());
        this._keyZoomHandler = new KeyZoomHandler(this, container, navigator, new ViewportCoords());
    }

    /**
     * Get key play.
     *
     * @returns {KeyPlayHandler} The key play handler.
     */
    public get keyPlay(): KeyPlayHandler {
        return this._keyPlayHandler;
    }

    /**
     * Get key sequence navigation.
     *
     * @returns {KeySequenceNavigationHandler} The key sequence navigation handler.
     */
    public get keySequenceNavigation(): KeySequenceNavigationHandler {
        return this._keySequenceNavigationHandler;
    }

    /**
     * Get spatial.
     *
     * @returns {KeySpatialNavigationHandler} The spatial handler.
     */
    public get keySpatialNavigation(): KeySpatialNavigationHandler {
        return this._keySpatialNavigationHandler;
    }

    /**
     * Get key zoom.
     *
     * @returns {KeyZoomHandler} The key zoom handler.
     */
    public get keyZoom(): KeyZoomHandler {
        return this._keyZoomHandler;
    }

    protected _activate(): void {
        this._configurationSubscription = this._configuration$
            .subscribe(
                (configuration: IKeyboardConfiguration): void => {
                    if (configuration.keyPlay) {
                        this._keyPlayHandler.enable();
                    } else {
                        this._keyPlayHandler.disable();
                    }

                    if (configuration.keySequenceNavigation) {
                        this._keySequenceNavigationHandler.enable();
                    } else {
                        this._keySequenceNavigationHandler.disable();
                    }

                    if (configuration.keySpatialNavigation) {
                        this._keySpatialNavigationHandler.enable();
                    } else {
                        this._keySpatialNavigationHandler.disable();
                    }

                    if (configuration.keyZoom) {
                        this._keyZoomHandler.enable();
                    } else {
                        this._keyZoomHandler.disable();
                    }
                });
    }

    protected _deactivate(): void {
        this._configurationSubscription.unsubscribe();

        this._keyPlayHandler.disable();
        this._keySequenceNavigationHandler.disable();
        this._keySpatialNavigationHandler.disable();
        this._keyZoomHandler.disable();
    }

    protected _getDefaultConfiguration(): IKeyboardConfiguration {
        return { keyPlay: true, keySequenceNavigation: true, keySpatialNavigation: true, keyZoom: true };
    }
}
