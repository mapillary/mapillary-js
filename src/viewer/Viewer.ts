import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IViewerOptions, Container, Navigator, ComponentController, EventLauncher} from "../Viewer";
import {Component} from "../Component";
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
     * Private ComponentController object which manages component states
     */
    private _componentController: ComponentController;

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
        this._componentController = new ComponentController(this._container, this._navigator, key, options);
        this._eventLauncher = new EventLauncher(this, this._navigator);

        Settings.setOptions({});

        super();
    }

    /**
     * Navigate to a given photo key
     * @param {string} key - a valid Mapillary photo key
     * @throws {ParamaterMapillaryError} If no key is provided
     */
    public moveToKey(key: string): void {
        this._navigator.moveToKey(key).subscribe(
            (node: Node): void => {
                return;
            },
            (error: Error): void => {
                return;
            }
        );
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
        this._navigator.moveDir(dir).subscribe(
            (node: Node): void => {
                return;
            },
            (error: Error): void => {
                return;
            }
        );
    }

    /**
     * Move close to given latitude and longitude
     * @param {Number} lat - Latitude
     * @param {Number} lon - Longitude
     */
    public moveCloseTo(lat: number, lon: number): void {
        this._navigator.moveCloseTo(lat, lon).subscribe(
            (node: Node): void => {
                return;
            },
            (error: Error): void => {
                return;
            }
        );
    }

    /**
     * Activate a Component
     * @param {string} name - Name of the component which will become active
     */
    public activateComponent(name: string): void {
        this._componentController.activate(name);
    }

    /**
     * Deactivate a Component
     * @param {string} name - Name of component which become inactive
     */
    public deactivateComponent(name: string): void {
        this._componentController.deactivate(name);
    }

    /**
     * Get a Component
     * @param {string} name - Name of component
     */
    public getComponent(name: string): Component {
        return this._componentController.get(name);
    }

    /**
     * Activate the Cover (deactivates all other components)
     */
    public activateCover(): void {
        this._componentController.activateCover();
    }

    /**
     * Deactivate the Cover (activates all components marked as active)
     */
    public deactivateCover(): void {
        this._componentController.deactivateCover();
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
