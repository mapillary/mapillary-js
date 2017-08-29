/// <reference path="../../typings/index.d.ts" />

import * as when from "when";

import {ILatLon} from "../API";
import {EdgeDirection} from "../Edge";
import {
    FilterExpression,
    Node,
} from "../Graph";
import {
    ComponentController,
    Container,
    IViewerOptions,
    Navigator,
    Observer,
} from "../Viewer";
import {
    Component,
    IComponentConfiguration,
} from "../Component";
import {
    EventEmitter,
    Settings,
} from "../Utils";
import {RenderMode} from "../Render";

/**
 * @class Viewer
 *
 * @classdesc The Viewer object represents the navigable photo viewer.
 * Create a Viewer by specifying a container, client ID, photo key and
 * other options. The viewer exposes methods and events for programmatic
 * interaction.
 *
 * The viewer works with a few different coordinate systems.
 *
 * Container pixel coordinates
 *
 * Pixel coordinates are coordinates on the viewer container. The origin is
 * in the top left corner of the container. The axes are
 * directed according to the following for a viewer container with a width
 * of 640 pixels and height of 480 pixels.
 *
 * ```
 * (0,0)                          (640, 0)
 *      +------------------------>
 *      |
 *      |
 *      |
 *      v                        +
 * (0, 480)                       (640, 480)
 * ```
 *
 * Basic image coordinates
 *
 * Basic image coordinates represents points in the original image adjusted for
 * orientation. They range from 0 to 1 on both axes. The origin is in the top left
 * corner of the image and the axes are directed
 * according to the following for all image types.
 *
 * ```
 * (0,0)                          (1, 0)
 *      +------------------------>
 *      |
 *      |
 *      |
 *      v                        +
 * (0, 1)                         (1, 1)
 * ```
 *
 * For every camera viewing direction it is possible to convert between these
 * two coordinate systems for the current node. The image can be panned and
 * zoomed independently of the size of the viewer container resulting in
 * different conversion results for different viewing directions.
 */
export class Viewer extends EventEmitter {
    /**
     * Fired when the viewing direction of the camera changes.
     * @event
     * @type {number} bearing - Value indicating the current bearing
     * measured in degrees clockwise with respect to north.
     */
    public static bearingchanged: string = "bearingchanged";

    /**
     * Fired when a pointing device (usually a mouse) is pressed and released at
     * the same point in the viewer.
     * @event
     * @type {IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static click: string = "click";

    /**
     * Fired when the right button of the mouse is clicked within the viewer.
     * @event
     * @type {IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static contextmenu: string = "contextmenu";

    /**
     * Fired when a pointing device (usually a mouse) is clicked twice at
     * the same point in the viewer.
     * @event
     * @type {IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static dblclick: string = "dblclick";

    /**
     * Fired when the viewer is loading more data.
     * @event
     * @type {boolean} loading - Boolean indicating whether the viewer is loading.
     */
    public static loadingchanged: string = "loadingchanged";

    /**
     * Fired when a pointing device (usually a mouse) is pressed within the viewer.
     * @event
     * @type {IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mousedown: string = "mousedown";

    /**
     * Fired when a pointing device (usually a mouse) is moved within the viewer.
     * @description Will not fire when the mouse is actively used, e.g. for drag pan.
     * @event
     * @type {IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mousemove: string = "mousemove";

    /**
     * Fired when a pointing device (usually a mouse) leaves the viewer's canvas.
     * @event
     * @type {IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mouseout: string = "mouseout";

    /**
     * Fired when a pointing device (usually a mouse) is moved onto the viewer's canvas.
     * @event
     * @type {IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mouseover: string = "mouseover";

    /**
     * Fired when a pointing device (usually a mouse) is released within the viewer.
     * @event
     * @type {IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mouseup: string = "mouseup";

    /**
     * Fired when the viewer motion stops and it is in a fixed
     * position with a fixed point of view.
     * @event
     */
    public static moveend: string = "moveend";

    /**
     * Fired when the motion from one view to another start,
     * either by changing the position (e.g. when changing node) or
     * when changing point of view (e.g. by interaction such as pan and zoom).
     * @event
     */
    public static movestart: string = "movestart";

    /**
     * Fired when the moveable state of the viewer changes.
     *
     * @description The moveable state indicates if the viewer supports
     * moving, i.e. calling the `moveToKey`, `moveDir` and `moveCloseTo`
     * methods. The viewer will not be in a moveable state if the cover
     * is activated and the viewer has been supplied a key. When the cover
     * is deactivated or activated without being supplied a key it will
     * be moveable.
     *
     * @event
     * @type {boolean} moveable - Boolean indicating whether the viewer is moveable.
     */
    public static moveablechanged: string = "moveablechanged";

    /**
     * Fired every time the viewer navigates to a new node.
     * @event
     * @type {Node} node - Current node.
     */
    public static nodechanged: string = "nodechanged";

    /**
     * Fired every time the sequence edges of the current node changes.
     * @event
     * @type {IEdgeStatus} status - The edge status object.
     */
    public static sequenceedgeschanged: string = "sequenceedgeschanged";

    /**
     * Fired every time the spatial edges of the current node changes.
     * @event
     * @type {IEdgeStatus} status - The edge status object.
     */
    public static spatialedgeschanged: string = "spatialedgeschanged";

    /**
     * @ignore
     * Private component controller object which manages component states.
     */
    private _componentController: ComponentController;

    /**
     * @ignore
     * Private container object which maintains the DOM Element,
     * renderers and relevant services.
     */
    private _container: Container;

    /**
     * @ignore
     * Private observer object which observes the viewer state and
     * fires events on behalf of the viewer.
     */
    private _observer: Observer;

    /**
     * @ignore
     * Private navigator object which controls navigation throught
     * the vast seas of Mapillary.
     */
    private _navigator: Navigator;

    /**
     * Create a new viewer instance.
     *
     * @param {string} id - Required `id` of a DOM element which will
     * be transformed into the viewer.
     * @param {string} clientId - Required `Mapillary API ClientID`. Can
     * be obtained from https://www.mapillary.com/app/settings/developers.
     * @param {string} [key] - Optional `photoId` to start from, can be any
     * Mapillary photo, if null no image is loaded.
     * @param {IViewerOptions} [options] - Optional configuration object
     * specifing Viewer's initial setup.
     * @param {string} [token] - Optional bearer token for API requests of
     * protected resources.
     *
     * @example
     * ```
     * var viewer = new Mapillary.Viewer("<element-id>", "<client-id>", "<my key>");
     * ```
     */
    constructor (id: string, clientId: string, key?: string, options?: IViewerOptions, token?: string) {
        super();

        options = options != null ? options : {};

        Settings.setOptions(options);

        this._navigator = new Navigator(clientId, token);
        this._container = new Container(id, this._navigator.stateService, options);
        this._observer = new Observer(this, this._navigator, this._container);
        this._componentController = new ComponentController(this._container, this._navigator, this._observer, key, options.component);
    }

    /**
     * Return a boolean indicating if the viewer is in a moveable state.
     *
     * @description The moveable state indicates if the viewer supports
     * moving, i.e. calling the `moveToKey`, `moveDir` and `moveCloseTo`
     * methods. The viewer will not be in a moveable state if the cover
     * is activated and the viewer has been supplied a key. When the cover
     * is deactivated or activated without being supplied a key it will
     * be moveable.
     *
     * @event
     * @returns {boolean} Boolean indicating whether the viewer is moveable.
     */
    public get isMoveable(): boolean {
        return this._componentController.moveable;
    }

    /**
     * Activate a component.
     *
     * @param {string} name - Name of the component which will become active.
     *
     * @example
     * ```
     * viewer.activateComponent("marker");
     * ```
     */
    public activateComponent(name: string): void {
        this._componentController.activate(name);
    }

    /**
     * Activate the cover (deactivates all other components).
     */
    public activateCover(): void {
        this._componentController.activateCover();
    }

    /**
     * Deactivate a component.
     *
     * @param {string} name - Name of component which become inactive.
     *
     * @example
     * ```
     * viewer.deactivateComponent("mouse");
     * ```
     */
    public deactivateComponent(name: string): void {
        this._componentController.deactivate(name);
    }

    /**
     * Deactivate the cover (activates all components marked as active).
     */
    public deactivateCover(): void {
        this._componentController.deactivateCover();
    }

    /**
     * Get the bearing of the current viewer camera.
     *
     * @description The bearing depends on how the camera
     * is currently rotated and does not correspond
     * to the compass angle of the current node if the view
     * has been panned.
     *
     * Bearing is measured in degrees clockwise with respect to
     * north.
     *
     * @returns {Promise<number>} Promise to the bearing
     * of the current viewer camera.
     *
     * @example
     * ```
     * viewer.getBearing().then((b) => { console.log(b); });
     * ```
     */
    public getBearing(): when.Promise<number> {
        return when.promise<number>(
            (resolve: (value: number) => void, reject: (reason: Error) => void): void => {
                this._container.renderService.bearing$
                    .first()
                    .subscribe(
                        (bearing: number): void => {
                            resolve(bearing);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Get the basic coordinates of the current photo that is
     * at the center of the viewport.
     *
     * @description Basic coordinates are 2D coordinates on the [0, 1] interval
     * and have the origin point, (0, 0), at the top left corner and the
     * maximum value, (1, 1), at the bottom right corner of the original
     * photo.
     *
     * @returns {Promise<number[]>} Promise to the basic coordinates
     * of the current photo at the center for the viewport.
     *
     * @example
     * ```
     * viewer.getCenter().then((c) => { console.log(c); });
     * ```
     */
    public getCenter(): when.Promise<number[]> {
        return when.promise<number[]>(
            (resolve: (value: number[]) => void, reject: (reason: Error) => void): void => {
                this._navigator.stateService.getCenter()
                    .subscribe(
                        (center: number[]): void => {
                            resolve(center);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Get a component.
     *
     * @param {string} name - Name of component.
     * @returns {Component} The requested component.
     *
     * @example
     * ```
     * var mouseComponent = viewer.getComponent("mouse");
     * ```
     */
    public getComponent<TComponent extends Component<IComponentConfiguration>>(name: string): TComponent {
        return this._componentController.get<TComponent>(name);
    }

    /**
     * Returns the viewer's containing HTML element.
     *
     * @returns {HTMLElement} The viewer's container.
     */
    public getContainer(): HTMLElement {
        return this._container.element;
    }

    /**
     * Get the photo's current zoom level.
     *
     * @returns {Promise<number>} Promise to the viewers's current
     * zoom level.
     *
     * @example
     * ```
     * viewer.getZoom().then((z) => { console.log(z); });
     * ```
     */
    public getZoom(): when.Promise<number> {
         return when.promise<number>(
            (resolve: (value: number) => void, reject: (reason: Error) => void): void => {
                this._navigator.stateService.getZoom()
                    .subscribe(
                        (zoom: number): void => {
                            resolve(zoom);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Move close to given latitude and longitude.
     *
     * @description Because the method propagates IO errors, these potential errors
     * need to be handled by the method caller (see example).
     *
     * @param {Number} lat - Latitude, in degrees.
     * @param {Number} lon - Longitude, in degrees.
     * @returns {Promise<Node>} Promise to the node that was navigated to.
     * @throws {Error} If no nodes exist close to provided latitude
     * longitude.
     * @throws {Error} Propagates any IO errors to the caller.
     *
     * @example
     * ```
     * viewer.moveCloseTo(0, 0).then(
     *     (n) => { console.log(n); },
     *     (e) => { console.error(e); });
     * ```
     */
    public moveCloseTo(lat: number, lon: number): when.Promise<Node> {
        return when.promise<Node>(
            (resolve: (value: Node) => void, reject: (reason: Error) => void): void => {
                this._navigator.moveCloseTo$(lat, lon).subscribe(
                    (node: Node): void => {
                        resolve(node);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
            });
    }

    /**
     * Navigate in a given direction.
     *
     * @description This method has to be called through EdgeDirection enumeration as in the example.
     *
     * @param {EdgeDirection} dir - Direction in which which to move.
     * @returns {Promise<Node>} Promise to the node that was navigated to.
     * @throws {Error} If the current node does not have the edge direction
     * or the edges has not yet been cached.
     * @throws {Error} Propagates any IO errors to the caller.
     *
     * @example
     * ```
     * viewer.moveDir(Mapillary.EdgeDirection.Next).then(
     *     (n) => { console.log(n); },
     *     (e) => { console.error(e); });
     * ```
     */
    public moveDir(dir: EdgeDirection): when.Promise<Node> {
        return when.promise<Node>(
            (resolve: (value: Node) => void, reject: (reason: Error) => void): void => {
                this._navigator.moveDir$(dir).subscribe(
                    (node: Node): void => {
                        resolve(node);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
            });
    }

    /**
     * Navigate to a given photo key.
     *
     * @param {string} key - A valid Mapillary photo key.
     * @returns {Promise<Node>} Promise to the node that was navigated to.
     * @throws {Error} Propagates any IO errors to the caller.
     *
     * @example
     * ```
     * viewer.moveToKey("<my key>").then(
     *     (n) => { console.log(n); },
     *     (e) => { console.error(e); });
     * ```
     */
    public moveToKey(key: string): when.Promise<Node> {
        return when.promise<Node>(
            (resolve: (value: Node) => void, reject: (reason: Error) => void): void => {
                this._navigator.moveToKey$(key).subscribe(
                    (node: Node): void => {
                        resolve(node);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
            });
    }

    /**
     * Project basic image coordinates for the current node to canvas pixel
     * coordinates.
     *
     * @description The basic image coordinates may not always correspond to a
     * pixel point that lies in the visible area of the viewer container.
     *
     * @param {Array<number>} basicPoint - Basic images coordinates to project.
     * @returns {Promise<ILatLon>} Promise to the pixel coordinates corresponding
     * to the basic image point.
     *
     * @example
     * ```
     * viewer.projectFromBasic([0.3, 0.7])
     *     .then((pixelPoint) => { console.log(pixelPoint); });
     * ```
     */
    public projectFromBasic(basicPoint: number[]): when.Promise<number[]> {
        return when.promise<number[]>(
            (resolve: (value: number[]) => void, reject: (reason: Error) => void): void => {
                this._observer.projectBasic$(basicPoint)
                    .subscribe(
                        (pixelPoint: number[]): void => {
                            resolve(pixelPoint);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Detect the viewer's new width and height and resize it.
     *
     * @description The components will also detect the viewer's
     * new size and resize their rendered elements if needed.
     *
     * @example
     * ```
     * viewer.resize();
     * ```
     */
    public resize(): void {
        this._container.renderService.resize$.next(null);
        this._componentController.resize();
    }

    /**
     * Set a bearer token for authenticated API requests of
     * protected resources.
     *
     * @description When the supplied token is null or undefined,
     * any previously set bearer token will be cleared and the
     * viewer will make unauthenticated requests.
     *
     * Calling setAuthToken aborts all outstanding move requests.
     * The promises of those move requests will be rejected and
     * the rejections need to be caught.
     *
     * @param {string} [token] token - Bearer token.
     * @returns {Promise<void>} Promise that resolves after token
     * is set.
     *
     * @example
     * ```
     * viewer.setAuthToken("<my token>")
     *     .then(() => { console.log("token set"); });
     * ```
     */
    public setAuthToken(token?: string): when.Promise<void> {
        return when.promise<void>(
            (resolve: (value: void) => void, reject: (reason: Error) => void): void => {
                this._navigator.setToken$(token)
                    .subscribe(
                        (): void => {
                            resolve(undefined);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Set the basic coordinates of the current photo to be in the
     * center of the viewport.
     *
     * @description Basic coordinates are 2D coordinates on the [0, 1] interval
     * and has the origin point, (0, 0), at the top left corner and the
     * maximum value, (1, 1), at the bottom right corner of the original
     * photo.
     *
     * @param {number[]} The basic coordinates of the current
     * photo to be at the center for the viewport.
     *
     * @example
     * ```
     * viewer.setCenter([0.5, 0.5]);
     * ```
     */
    public setCenter(center: number[]): void {
        this._navigator.stateService.setCenter(center);
    }

    /**
     * Set the filter selecting nodes to use when calculating
     * the spatial edges.
     *
     * @description The following filter types are supported:
     *
     * Comparison
     *
     * `["==", key, value]` equality: `node[key] = value`
     *
     * `["!=", key, value]` inequality: `node[key] ≠ value`
     *
     * `["<", key, value]` less than: `node[key] < value`
     *
     * `["<=", key, value]` less than or equal: `node[key] ≤ value`
     *
     * `[">", key, value]` greater than: `node[key] > value`
     *
     * `[">=", key, value]` greater than or equal: `node[key] ≥ value`
     *
     * Set membership
     *
     * `["in", key, v0, ..., vn]` set inclusion: `node[key] ∈ {v0, ..., vn}`
     *
     * `["!in", key, v0, ..., vn]` set exclusion: `node[key] ∉ {v0, ..., vn}`
     *
     * Combining
     *
     * `["all", f0, ..., fn]` logical `AND`: `f0 ∧ ... ∧ fn`
     *
     * A key must be a string that identifies a node property name. A value must be
     * a string, number, or boolean. Strictly-typed comparisons are used. The values
     * `f0, ..., fn` of the combining filter must be filter expressions.
     *
     * Clear the filter by setting it to null or empty array.
     *
     * @param {FilterExpression} filter - The filter expression.
     * @returns {Promise<void>} Promise that resolves after filter is applied.
     *
     * @example
     * ```
     * viewer.setFilter(["==", "sequenceKey", "<my sequence key>"]);
     * ```
     */
    public setFilter(filter: FilterExpression): when.Promise<void> {
        return when.promise<void>(
            (resolve: (value: void) => void, reject: (reason: Error) => void): void => {
                this._navigator.setFilter$(filter)
                    .subscribe(
                        (): void => {
                            resolve(undefined);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Set the viewer's render mode.
     *
     * @param {RenderMode} renderMode - Render mode.
     *
     * @example
     * ```
     * viewer.setRenderMode(Mapillary.RenderMode.Letterbox);
     * ```
     */
    public setRenderMode(renderMode: RenderMode): void {
        this._container.renderService.renderMode$.next(renderMode);
    }

    /**
     * Set the photo's current zoom level.
     *
     * @description Possible zoom level values are on the [0, 3] interval.
     * Zero means zooming out to fit the photo to the view whereas three
     * shows the highest level of detail.
     *
     * @param {number} The photo's current zoom level.
     *
     * @example
     * ```
     * viewer.setZoom(2);
     * ```
     */
    public setZoom(zoom: number): void {
        this._navigator.stateService.setZoom(zoom);
    }

    /**
     * Unproject canvas pixel coordinates to an ILatLon representing geographical
     * coordinates.
     *
     * @description The pixel point may not always correspond to geographical
     * coordinates. In the case of no correspondence the returned value will
     * be `null`.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates to unproject.
     * @returns {Promise<ILatLon>} Promise to the latLon corresponding to the pixel point.
     *
     * @example
     * ```
     * viewer.unproject([100, 100])
     *     .then((latLon) => { console.log(latLon); });
     * ```
     */
    public unproject(pixelPoint: number[]): when.Promise<ILatLon> {
        return when.promise<ILatLon>(
            (resolve: (value: ILatLon) => void, reject: (reason: Error) => void): void => {
                this._observer.unproject$(pixelPoint)
                    .subscribe(
                        (latLon: ILatLon): void => {
                            resolve(latLon);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Unproject canvas pixel coordinates to basic image coordinates for the
     * current node.
     *
     * @description The pixel point may not always correspond to basic image
     * coordinates. In the case of no correspondence the returned value will
     * be `null`.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates to unproject.
     * @returns {Promise<ILatLon>} Promise to the basic coordinates corresponding
     * to the pixel point.
     *
     * @example
     * ```
     * viewer.unprojectToBasic([100, 100])
     *     .then((basicPoint) => { console.log(basicPoint); });
     * ```
     */
    public unprojectToBasic(pixelPoint: number[]): when.Promise<number[]> {
        return when.promise<number[]>(
            (resolve: (value: number[]) => void, reject: (reason: Error) => void): void => {
                this._observer.unprojectBasic$(pixelPoint)
                    .subscribe(
                        (basicPoint: number[]): void => {
                            resolve(basicPoint);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }
}
