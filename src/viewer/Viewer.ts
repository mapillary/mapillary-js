/// <reference path="../../typings/index.d.ts" />

import * as when from "when";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IViewerOptions, Container, Navigator, ComponentController, EventLauncher} from "../Viewer";
import {Component, IComponentConfiguration} from "../Component";
import {EventEmitter, Settings} from "../Utils";
import {RenderMode} from "../Render";

/**
 * @class Viewer
 *
 * @classdesc The Viewer object represents the navigable photo viewer.
 * Create a Viewer by specifying a container, client ID, photo key and
 * other options. The viewer exposes methods and events for programmatic
 * interaction.
 */
export class Viewer extends EventEmitter {
    /**
     * Fired every time the viewer navigates to a new node.
     * @event
     * @type {Node} node - Current node.
     */
    public static nodechanged: string = "nodechanged";

    /**
     * Fired when the viewer is loading more data.
     * @event
     * @type {boolean} loading - Value indicating whether the viewer is loading.
     */
    public static loadingchanged: string = "loadingchanged";

    /**
     * Private Container object which maintains the DOM Element,
     * renderers and relevant services.
     */
    private _container: Container;

    /**
     * Private Navigator object which controls navigation throught
     * the vast seas of Mapillary.
     */
    private _navigator: Navigator;

    /**
     * Private ComponentController object which manages component states.
     */
    private _componentController: ComponentController;

    /**
     * Private EventLauncher object which fires events on behalf of
     * the viewer.
     */
    private _eventLauncher: EventLauncher;

    /**
     * Create a new viewer instance.
     *
     * @param {string} id - required `id` of an DOM element which will
     * be transformed into the viewer.
     * @param {string} clientId - required `Mapillary API ClientID`, can
     * be obtained from https://www.mapillary.com/app/settings/developers.
     * @param {string} key - optional `photoId` to start from, can be any
     * Mapillary photo, if null no image is loaded.
     * @param {IViewerOptions} options - optional configuration object
     * specifing Viewer's initial setup.
     */
    constructor (id: string, clientId: string, key?: string, options?: IViewerOptions) {
        super();

        if (options === undefined) {
            options = {};
        }

        Settings.setOptions(options);

        this._navigator = new Navigator(clientId);
        this._container = new Container(id, this._navigator.stateService, options);
        this._eventLauncher = new EventLauncher(this, this._navigator, this._container);
        this._componentController = new ComponentController(this._container, this._navigator, key, options);
    }

    /**
     * Navigate to a given photo key.
     *
     * @param {string} key - A valid Mapillary photo key.
     * @throws {ParamaterMapillaryError} If no key is provided.
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
     * Navigate in a given direction.
     *
     * @description This method has to be called through EdgeDirection enumeration as in the example.
     *
     * @param {EdgeDirection} dir - Direction in which which to move.
     * @example `viewer.moveDir(Mapillary.EdgeDirection.Next);`
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
     * Move close to given latitude and longitude.
     *
     * @param {Number} lat - Latitude, in degrees.
     * @param {Number} lon - Longitude, in degrees.
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
     *
     * @description The components will also detect the viewer's
     * new size and resize their rendered elements if needed.
     */
    public resize(): void {
        this._container.renderService.resize$.next(null);
        this._componentController.resize();
    }

    /**
     * Set the viewer's render mode.
     * @param {RenderMode} renderMode - Render mode.
     *
     * @example `viewer.setRenderMode(Mapillary.RenderMode.Letterbox);`
     */
    public setRenderMode(renderMode: RenderMode): void {
        this._container.renderService.renderMode$.next(renderMode);
    }

    /**
     * Activate a component.
     * @param {string} name - Name of the component which will become active.
     */
    public activateComponent(name: string): void {
        this._componentController.activate(name);
    }

    /**
     * Deactivate a component.
     * @param {string} name - Name of component which become inactive.
     */
    public deactivateComponent(name: string): void {
        this._componentController.deactivate(name);
    }

    /**
     * Get a component.
     * @param {string} name - Name of component.
     * @returns {Component} The requested component.
     */
    public getComponent<TComponent extends Component<IComponentConfiguration>>(name: string): TComponent {
        return this._componentController.get<TComponent>(name);
    }

    /**
     * Activate the cover (deactivates all other components).
     */
    public activateCover(): void {
        this._componentController.activateCover();
    }

    /**
     * Deactivate the cover (activates all components marked as active).
     */
    public deactivateCover(): void {
        this._componentController.deactivateCover();
    }

    /**
     * Set an OAuth 2.0 bearer token for API requests of protected resources.
     *
     * @description When the supplied access token is an empty string
     * or null, any previously set access token will be cleared.
     *
     * @param {string} token OAuth 2.0 bearer token.
     * @param {string} projectKey Deprecated.
     */
    public auth(token: string, projectKey?: string): void {
        this._navigator.auth(token, projectKey);
    }

    public getCenter(): when.Promise<number[]> {
        return when.promise<number[]>(
            (resolve: any, reject: any): void => {
                this._navigator.stateService.getCenter()
                    .subscribe(
                        (center: number[]): void => {
                            resolve(center);
                        },
                        (error: Error): void => {
                            reject(error);
                        }
                    );
            });
    }

    public getZoom(): when.Promise<number> {
         return when.promise<number>(
            (resolve: any, reject: any): void => {
                this._navigator.stateService.getZoom()
                    .subscribe(
                        (zoom: number): void => {
                            resolve(zoom);
                        },
                        (error: Error): void => {
                            reject(error);
                        }
                    );
            });
    }

    public setCenter(center: number[]): void {
        this._navigator.stateService.setCenter(center);
    }

    public setZoom(zoom: number): void {
        this._navigator.stateService.setZoom(zoom);
    }
}
