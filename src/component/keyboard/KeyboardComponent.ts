import {Subscription} from "rxjs/Subscription";

import {
    ComponentService,
    Component,
    IKeyboardConfiguration,
    SequenceHandler,
    SpatialHandler,
} from "../../Component";
import {Spatial} from "../../Geo";
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

    private _sequenceHandler: SequenceHandler;
    private _spatialHandler: SpatialHandler;

    private _configurationSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._sequenceHandler = new SequenceHandler(this, container, navigator);
        this._spatialHandler = new SpatialHandler(this, container, navigator, new Spatial());
    }

    /**
     * Get sequence.
     *
     * @returns {SequenceHandler} The sequence handler.
     */
    public get sequence(): SequenceHandler {
        return this._sequenceHandler;
    }

    /**
     * Get spatial.
     *
     * @returns {SpatialHandler} The spatial handler.
     */
    public get spatial(): SpatialHandler {
        return this._spatialHandler;
    }

    protected _activate(): void {
        this._configurationSubscription = this._configuration$
            .subscribe(
                (configuration: IKeyboardConfiguration): void => {
                    if (configuration.sequence) {
                        this._sequenceHandler.enable();
                    } else {
                        this._sequenceHandler.disable();
                    }

                    if (configuration.spatial) {
                        this._spatialHandler.enable();
                    } else {
                        this._spatialHandler.disable();
                    }
                });
    }

    protected _deactivate(): void {
        this._configurationSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IKeyboardConfiguration {
        return { sequence: true, spatial: true };
    }
}

ComponentService.register(KeyboardComponent);
export default KeyboardComponent;
