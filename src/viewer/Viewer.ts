import {EdgeDirection} from "../Edge";
import {IViewerOptions, Container, Navigator, UIController, EventLauncher} from "../Viewer";
import {UI} from "../UI";
import {EventEmitter, Settings} from "../Utils";

export class Viewer extends EventEmitter {
    /**
     * Private Container object which maintains the DOM Element, renderers and relevant services
     */
    private _container: Container;

    /**
     * Private Navigator object which controls navigation throught the vast seas of Mapillary
     */
    private _navigator: Navigator;

    /**
     * Private UIController object which manages UI/Component states
     */
    private _uiController: UIController;

    /**
     * Private EventLauncher object which fires events on behalf of the viewer
     */
    private _eventLauncher: EventLauncher;

    /**
     * Create a new viewer instance
     * @class Viewer
     * @param {string} id - required `id` of an DOM element which will be transformed into the viewer
     * @param {string} clientId - required `Mapillary API ClientID`, can be obtained from http://www.mapillary.com/map/settings/integrations
     * @param {string} key - required `photoId` to start from, can be any Mapillary photo
     * @param {IViewerOptions} options - optional configuration object specifing Viewer's initial setup
     */
    constructor (id: string, clientId: string, key: string, options: IViewerOptions) {
        if (options === undefined) {
            options = {};
        }

        this._navigator = new Navigator(clientId);
        this._container = new Container(id, this._navigator.stateService.currentState$);
        this._uiController = new UIController(this._container, this._navigator, key, options);
        this._eventLauncher = new EventLauncher(this, this._navigator.loadingService, this._navigator.stateService);

        Settings.setOptions({});

        super();
    }

    /**
     * Navigate to a given photo key
     * @param {string} key - a valid Mapillary photo key
     * @throws {ParamaterMapillaryError} If no key is provided
     */
    public moveToKey(key: string): void {
        this._navigator.moveToKey(key).subscribe();
    }

    /**
     * Move in a given direction
     *
     * This method has to be called through EdgeDirection enumeration as in the example.
     *
     * @param {EdgeDirection} dir - Direction towards which to move
     * @example
     * `viewer.moveToDir(Mapillary.EdgeDirection['NEXT'])`
     */
    public moveDir(dir: EdgeDirection): void {
        this._navigator.moveDir(dir).subscribe();
    }

    /**
     * Move close to given latitude and longitude
     * @param {Number} lat - Latitude
     * @param {Number} lon - Longitude
     */
    public moveCloseTo(lat: number, lon: number): void {
        this._navigator.moveCloseTo(lat, lon).subscribe();
    }

    /**
     * Activate a Component
     * @param {string} name - Name of the component which will become active
     */
    public activateComponent(name: string): void {
        this._uiController.activate(name);
    }

    /**
     * Deactivate a Component
     * @param {string} name - Name of component which become inactive
     */
    public deactivateComponent(name: string): void {
        this._uiController.deactivate(name);
    }

    /**
     * Get a Component
     * @param {string} name - Name of component
     */
    public getComponent(name: string): UI {
        return this._uiController.get(name);
    }

    /**
     * Activate the Cover (deactivates all other components)
     */
    public activateCover(): void {
        this._uiController.activateCover();
    }

    /**
     * Deactivate the Cover (activates all components marked as active)
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
