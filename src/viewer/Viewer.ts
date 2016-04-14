import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IViewerOptions, Container, Navigator, ComponentController, EventLauncher} from "../Viewer";
import {Component} from "../Component";
import {EventEmitter, Settings} from "../Utils";
import {RenderMode} from "../Render";

import * as when from "when";

export class Viewer extends EventEmitter {
    /**
     * Fired every time the viewer goes to a new node (photo)
     * @event
     */
    public static nodechanged: string = "nodechanged";

    /**
     * Fired when the viewer is loading more data
     * @event
     */
    public static loadingchanged: string = "loadingchanged";

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
     * @param {string} key - optional `photoId` to start from, can be any Mapillary photo, if null no image is loaded
     * @param {IViewerOptions} options - optional configuration object specifing Viewer's initial setup
     */
    constructor (id: string, clientId: string, key?: string, options?: IViewerOptions) {
        super();

        if (options === undefined) {
            options = {};
        }

        Settings.setOptions(options);

        this._navigator = new Navigator(clientId);
        this._container = new Container(id, this._navigator.stateService, options);
        this._componentController = new ComponentController(this._container, this._navigator, key, options);
        this._eventLauncher = new EventLauncher(this, this._navigator);
    }

    /**
     * Navigate to a given photo key
     * @param {string} key - a valid Mapillary photo key
     * @throws {ParamaterMapillaryError} If no key is provided
     */
    public moveToKey(key: string): when.Promise<Node> {
        return when.promise<Node>((resolve: any, reject: any): void => {
            this._navigator.moveToKey(key).subscribe(
                (node: Node): void => {
                    resolve(node);
                },
                (error: Error): void => {
                    reject(error);
                }
            );
        });
    }

    /**
     * Move in a given direction
     *
     * This method has to be called through EdgeDirection enumeration as in the example.
     *
     * @param {EdgeDirection} dir - Direction towards which to move
     * @example
     * `viewer.moveToDir(Mapillary.EdgeDirection.NEXT);`
     */
    public moveDir(dir: EdgeDirection): when.Promise<Node> {
        return when.promise<Node>((resolve: any, reject: any): void => {
            this._navigator.moveDir(dir).subscribe(
                (node: Node): void => {
                    resolve(node);
                },
                (error: Error): void => {
                    reject(error);
                }
            );
        });
    }

    /**
     * Move close to given latitude and longitude
     * @param {Number} lat - Latitude
     * @param {Number} lon - Longitude
     */
    public moveCloseTo(lat: number, lon: number): when.Promise<Node> {
        return when.promise<Node>((resolve: any, reject: any): void => {
            this._navigator.moveCloseTo(lat, lon).subscribe(
                (node: Node): void => {
                    resolve(node);
                },
                (error: Error): void => {
                    reject(error);
                }
            );
        });
    }

    /**
     * Detect the viewer's new width and height and resize it.
     */
    public resize(): void {
        this._container.renderService.resize$.onNext(null);
    }

    /**
     * Sets the viewer's render mode.
     * @param {RenderMode} renderMode - Render mode.
     *
     * @example `viewer.setRenderMode(Mapillary.RenderMode.Letterbox);`
     */
    public setRenderMode(renderMode: RenderMode): void {
        this._container.renderService.renderMode$.onNext(renderMode);
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
