import { Component } from "../Component";

import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { Spatial } from "../../geo/Spatial";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { KeyboardConfiguration } from "../interfaces/KeyboardConfiguration";
import { KeySequenceNavigationHandler } from "./KeySequenceNavigationHandler";
import { KeySpatialNavigationHandler } from "./KeySpatialNavigationHandler";
import { KeyZoomHandler } from "./KeyZoomHandler";
import { KeyPlayHandler } from "./KeyPlayHandler";
import { ComponentName } from "../ComponentName";

/**
 * @class KeyboardComponent
 *
 * @classdesc Component for keyboard event handling.
 *
 * To retrive and use the keyboard component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 *
 * var keyboardComponent = viewer.getComponent("keyboard");
 * ```
 */
export class KeyboardComponent extends Component<KeyboardConfiguration> {
    public static componentName: ComponentName = "keyboard";

    private _keyPlayHandler: KeyPlayHandler;
    private _keySequenceNavigationHandler: KeySequenceNavigationHandler;
    private _keySpatialNavigationHandler: KeySpatialNavigationHandler;
    private _keyZoomHandler: KeyZoomHandler;

    /** @ignore */
    constructor(
        name: string,
        container: Container,
        navigator: Navigator) {

        super(name, container, navigator);

        this._keyPlayHandler =
            new KeyPlayHandler(
                this,
                container,
                navigator);

        this._keySequenceNavigationHandler =
            new KeySequenceNavigationHandler(
                this,
                container,
                navigator);

        this._keySpatialNavigationHandler =
            new KeySpatialNavigationHandler(
                this,
                container,
                navigator,
                new Spatial());

        this._keyZoomHandler =
            new KeyZoomHandler(
                this,
                container,
                navigator,
                new ViewportCoords());
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
        this._subscriptions.push(this._configuration$
            .subscribe(
                (configuration: KeyboardConfiguration): void => {
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
                }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();

        this._keyPlayHandler.disable();
        this._keySequenceNavigationHandler.disable();
        this._keySpatialNavigationHandler.disable();
        this._keyZoomHandler.disable();
    }

    protected _getDefaultConfiguration(): KeyboardConfiguration {
        return { keyPlay: true, keySequenceNavigation: true, keySpatialNavigation: true, keyZoom: true };
    }
}
