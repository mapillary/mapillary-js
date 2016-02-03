import {EdgeDirection} from "../Edge";
import {IViewerOptions, Container, Navigator, UIController} from "../Viewer";
import {UI} from "../UI";
import {EventEmitter, Settings} from "../Utils";

export class Viewer extends EventEmitter {
    /**
     * Container handling the space occupied by the viewer
     * @private
     * @type {Container}
     */
    private _container: Container;

    /**
     * Navigator used to Navigate the vast seas of Mapillary
     * @private
     * @type {Navigator}
     */
    private _navigator: Navigator;

    /**
     * Commands UIs
     * @private
     * @type {UIController}
     */
    private _uiController: UIController;

    /**
     * Creates a viewer instance
     * @class Viewer
     * @param {string} id - `id` of an DOM element which will be transformed into the viewer
     * @param {string} clientId - Mapillary API Client ID
     * @param {string} key - Image key to start from
     * @param {IViewerOptions} options
     */
    constructor (id: string, clientId: string, key: string, options: IViewerOptions) {
        if (options === undefined) {
            options = {};
        }

        this._navigator = new Navigator(clientId);
        this._container = new Container(id, this._navigator.stateService.currentState$);
        this._uiController = new UIController(this._container, this._navigator, key, options);

        Settings.setOptions({});

        super();
    }

    /**
     * Move to a photo key
     * @method
     * @param {string} key Mapillary photo key to move to
     * @throws {ParamaterMapillaryError} If no key is provided
     */
    public moveToKey(key: string): void {
        this._navigator.moveToKey(key).subscribe();
    }

    /**
     * Move in a given direction
     * @method
     * @param {Direction} dir - Direction towards which to move
     */
    public moveDir(dir: EdgeDirection): void {
        this._navigator.moveDir(dir).subscribe();
    }

    /**
     * Move close to given latitude and longitude
     * @method
     * @param {Number} lat - Latitude
     * @param {Number} lon - Longitude
     */
    public moveCloseTo(lat: number, lon: number): void {
        this._navigator.moveCloseTo(lat, lon).subscribe();
    }

    /**
     * Activate a Component
     * @method
     * @param {string} name - Name of component
     */
    public activateComponent(name: string): void {
        this._uiController.activate(name);
    }

    /**
     * Deactivate a Component
     * @method
     * @param {string} name - Name of component
     */
    public deactivateComponent(name: string): void {
        this._uiController.deactivate(name);
    }

    /**
     * Get a Component
     * @method
     * @param {string} name - Name of component
     */
    public getComponent(name: string): UI {
        return this._uiController.get(name);
    }

    /**
     * Activate the Cover (deactivates all other components)
     * @method
     */
    public activateCover(): void {
        this._uiController.activateCover();
    }

    /**
     * Deactivate the Cover (activates all components marked as active)
     * @method
     */
    public deactivateCover(): void {
        this._uiController.deactivateCover();
    }
}

/**
 * Node change event
 *
 * @event nodechange
 * @memberof Viewer
 * @type {Object}
 * @property {TODO} TODO
 */

/**
 * The loading state changed
 *
 * @event loadingchanged
 * @memberof Viewer
 * @type {Object}
 * @property {TODO} TODO
 */

/**
 * Load event
 *
 * @event load
 * @memberof Viewer
 * @type {Object}
 * @property {TODO} TODO
 */
