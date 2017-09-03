import {Subscription} from "rxjs/Subscription";

import {
    ComponentService,
    Component,
    IKeyboardConfiguration,
    KeyZoomHandler,
    KeySequenceNavigationHandler,
    KeySpatialNavigationHandler,
} from "../../Component";
import {
    Spatial,
    ViewportCoords,
} from "../../Geo";
import {
    Container,
    Navigator,
} from "../../Viewer";

/**
 * @class KeyboardComponent
 *
 * @classdesc Component for keyboard event handling.
 *
 * To retrive and use the keyboard component
 *
 * @example
 * ```
 * var viewer = new Mapillary.Viewer(
 *     "<element-id>",
 *     "<client-id>",
 *     "<my key>");
 *
 * var keyboardComponent = viewer.getComponent("keyboard");
 * ```
 */
export class KeyboardComponent extends Component<IKeyboardConfiguration> {
    public static componentName: string = "keyboard";

    private _keyZoomHandler: KeyZoomHandler;
    private _keySequenceNavigationHandler: KeySequenceNavigationHandler;
    private _keySpatialNavigationHandler: KeySpatialNavigationHandler;

    private _configurationSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._keyZoomHandler = new KeyZoomHandler(this, container, navigator, new ViewportCoords());
        this._keySequenceNavigationHandler = new KeySequenceNavigationHandler(this, container, navigator);
        this._keySpatialNavigationHandler = new KeySpatialNavigationHandler(this, container, navigator, new Spatial());
    }

    /**
     * Get key zoom.
     *
     * @returns {KeyZoomHandler} The key zoom handler.
     */
    public get keyZoom(): KeyZoomHandler {
        return this._keyZoomHandler;
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

    protected _activate(): void {
        this._configurationSubscription = this._configuration$
            .subscribe(
                (configuration: IKeyboardConfiguration): void => {
                    if (configuration.keyZoom) {
                        this._keyZoomHandler.enable();
                    } else {
                        this._keyZoomHandler.disable();
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
                });
    }

    protected _deactivate(): void {
        this._configurationSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IKeyboardConfiguration {
        return { keySequenceNavigation: true, keySpatialNavigation: true, keyZoom: true };
    }
}

ComponentService.register(KeyboardComponent);
export default KeyboardComponent;
