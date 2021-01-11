import {
    throwError as observableThrowError,
    combineLatest as observableCombineLatest,
    Observable,
} from "rxjs";

import { first } from "rxjs/operators";
import * as when from "when";

import { ILatLon } from "../API";
import { EdgeDirection } from "../Edge";
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
    Urls,
} from "../Utils";
import { RenderMode } from "../Render";
import { TransitionMode } from "../State";
import { IPointOfView } from "./interfaces/interfaces";
import RenderCamera from "../render/RenderCamera";
import ILatLonAlt from "../geo/interfaces/ILatLonAlt";

/**
 * @class Viewer
 *
 * @classdesc The Viewer object represents the navigable image viewer.
 * Create a Viewer by specifying a container, client ID, image key and
 * other options. The viewer exposes methods and events for programmatic
 * interaction.
 *
 * In the case of asynchronous methods, MapillaryJS returns promises to
 * the results. Notifications are always emitted through JavaScript events.
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
     *
     * @description Related to the computed compass angle
     * ({@link Node.computedCA}) from SfM, not the original EXIF compass
     * angle.
     *
     * @event
     * @type {number} bearing - Value indicating the current bearing
     * measured in degrees clockwise with respect to north.
     */
    public static bearingchanged: string = "bearingchanged";

    /**
     * Fired when a pointing device (usually a mouse) is pressed and released at
     * the same point in the viewer.
     * @event
     * @type  {@link IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static click: string = "click";

    /**
     * Fired when the right button of the mouse is clicked within the viewer.
     * @event
     * @type  {@link IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static contextmenu: string = "contextmenu";

    /**
     * Fired when a pointing device (usually a mouse) is clicked twice at
     * the same point in the viewer.
     * @event
     * @type  {@link IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static dblclick: string = "dblclick";

    /**
     * Fired when the viewer's vertical field of view changes.
     *
     * @event
     * @type  {@link IViewerEvent} event - The event object.
     */
    public static fovchanged: string = "fovchanged";

    /**
     * Fired when the viewer is loading more data.
     * @event
     * @type {boolean} loading - Boolean indicating whether the viewer is loading.
     */
    public static loadingchanged: string = "loadingchanged";

    /**
     * Fired when a pointing device (usually a mouse) is pressed within the viewer.
     * @event
     * @type  {@link IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mousedown: string = "mousedown";

    /**
     * Fired when a pointing device (usually a mouse) is moved within the viewer.
     * @description Will not fire when the mouse is actively used, e.g. for drag pan.
     * @event
     * @type  {@link IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mousemove: string = "mousemove";

    /**
     * Fired when a pointing device (usually a mouse) leaves the viewer's canvas.
     * @event
     * @type  {@link IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mouseout: string = "mouseout";

    /**
     * Fired when a pointing device (usually a mouse) is moved onto the viewer's canvas.
     * @event
     * @type  {@link IViewerMouseEvent} event - Viewer mouse event data.
     */
    public static mouseover: string = "mouseover";

    /**
     * Fired when a pointing device (usually a mouse) is released within the viewer.
     * @event
     * @type  {@link IViewerMouseEvent} event - Viewer mouse event data.
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
     * Fired when the navigable state of the viewer changes.
     *
     * @description The navigable state indicates if the viewer supports
     * moving, i.e. calling the `moveToKey` and `moveDir`
     * methods. The viewer will not be in a navigable state if the cover
     * is activated and the viewer has been supplied a key. When the cover
     * is deactivated or activated without being supplied a key it will
     * be navigable.
     *
     * @event
     * @type {boolean} navigable - Boolean indicating whether the viewer is navigable.
     */
    public static navigablechanged: string = "navigablechanged";

    /**
     * Fired every time the viewer navigates to a new node.
     *
     * @event
     * @type  {@link Node} node - Current node.
     */
    public static nodechanged: string = "nodechanged";

    /**
     * Fired when the viewer's position changes.
     *
     * @description The viewer's position changes when transitioning
     * between nodes.
     *
     * @event
     * @type  {@link IViewerEvent} event - The event object.
     */
    public static positionchanged: string = "positionchanged";

    /**
     * Fired when the viewer's point of view changes. The point of view changes
     * when the bearing, or tilt changes.
     *
     * @event
     * @type  {@link IViewerEvent} event - The event object.
     */
    public static povchanged: string = "povchanged";

    /**
     * Fired when the viewer is removed. After this event is emitted
     * you must not call any methods on the viewer.
     *
     * @event
     * @type  {@link IViewerEvent} event - The event object.
     */
    public static removed: string = "removed";

    /**
     * Fired every time the sequence edges of the current node changes.
     * @event
     * @type  {@link IEdgeStatus} status - The edge status object.
     */
    public static sequenceedgeschanged: string = "sequenceedgeschanged";

    /**
     * Fired every time the spatial edges of the current node changes.
     * @event
     * @type  {@link IEdgeStatus} status - The edge status object.
     */
    public static spatialedgeschanged: string = "spatialedgeschanged";

    /**
     * Private component controller object which manages component states.
     */
    private _componentController: ComponentController;

    /**
     * Private container object which maintains the DOM Element,
     * renderers and relevant services.
     */
    private _container: Container;

    /**
     * Private observer object which observes the viewer state and
     * fires events on behalf of the viewer.
     */
    private _observer: Observer;

    /**
     * Private navigator object which controls navigation throught
     * the vast seas of Mapillary.
     */
    private _navigator: Navigator;

    /**
     * Create a new viewer instance.
     *
     * @description It is possible to initialize the viewer with or
     * without a key.
     *
     * When you want to show a specific image in the viewer from
     * the start you should initialize it with a key.
     *
     * When you do not know the first image key at implementation
     * time, e.g. in a map-viewer application you should initialize
     * the viewer without a key and call `moveToKey` instead.
     *
     * When initializing with a key the viewer is bound to that key
     * until the node for that key has been successfully loaded.
     * Also, a cover with the image of the key will be shown.
     * If the data for that key can not be loaded because the key is
     * faulty or other errors occur it is not possible to navigate
     * to another key because the viewer is not navigable. The viewer
     * becomes navigable when the data for the key has been loaded and
     * the image is shown in the viewer. This way of initializing
     * the viewer is mostly for embedding in blog posts and similar
     * where one wants to show a specific image initially.
     *
     * If the viewer is initialized without a key (with null or
     * undefined) it is not bound to any particular key and it is
     * possible to move to any key with `viewer.moveToKey("<my-image-key>")`.
     * If the first move to a key fails it is possible to move to another
     * key. The viewer will show a black background until a move
     * succeeds. This way of intitializing is suited for a map-viewer
     * application when the initial key is not known at implementation
     * time.
     *
     * @param {IViewerOptions} options - Optional configuration object
     * specifing Viewer's and the components' initial setup.
     *
     * @example
     * ```
     * var viewer = new Mapillary.Viewer({
     *     apiClient: "<my-client-id>",
     *     container: "<my-container-id>",
     * });
     * ```
     */
    constructor(options: IViewerOptions) {
        super();

        Settings.setOptions(options);
        Urls.setOptions(options.url);

        this._navigator = new Navigator(options);
        this._container = new Container(options, this._navigator.stateService);
        this._observer = new Observer(this, this._navigator, this._container);
        this._componentController = new ComponentController(
            this._container,
            this._navigator,
            this._observer,
            options.imageKey,
            options.component);
    }

    /**
     * Return a boolean indicating if the viewer is in a navigable state.
     *
     * @description The navigable state indicates if the viewer supports
     * moving, i.e. calling the {@link moveToKey} and {@link moveDir}
     * methods or changing the authentication state,
     * i.e. calling {@link setUserToken}. The viewer will not be in a navigable
     * state if the cover is activated and the viewer has been supplied a key.
     * When the cover is deactivated or the viewer is activated without being
     * supplied a key it will be navigable.
     *
     * @returns {boolean} Boolean indicating whether the viewer is navigable.
     */
    public get isNavigable(): boolean {
        return this._componentController.navigable;
    }

    /**
     * Activate the combined panning functionality.
     *
     * @description The combined panning functionality is active by default.
     */
    public activateCombinedPanning(): void {
        this._navigator.panService.enable();
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
     * Deactivate the combined panning functionality.
     *
     * @description Deactivating the combined panning functionality
     * could be needed in scenarios involving sequence only navigation.
     */
    public deactivateCombinedPanning(): void {
        this._navigator.panService.disable();
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
                this._container.renderService.bearing$.pipe(
                    first())
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
     * Returns the HTML element containing the viewer's <canvas> element.
     *
     * @description This is the element to which event bindings for viewer
     * interactivity (such as panning and zooming) are attached.
     *
     * @returns {HTMLElement} The container viewer's <canvas> element.
     */
    public getCanvasContainer(): HTMLElement {
        return this._container.canvasContainer;
    }

    /**
     * Get the basic coordinates of the current image that is
     * at the center of the viewport.
     *
     * @description Basic coordinates are 2D coordinates on the [0, 1] interval
     * and have the origin point, (0, 0), at the top left corner and the
     * maximum value, (1, 1), at the bottom right corner of the original
     * image.
     *
     * @returns {Promise<number[]>} Promise to the basic coordinates
     * of the current image at the center for the viewport.
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
        return this._container.container;
    }

    /**
     * Get the viewer's current vertical field of view.
     *
     * @description The vertical field of view rendered on the viewer canvas
     * measured in degrees.
     *
     * @returns {Promise<number>} Promise to the current field of view
     * of the viewer camera.
     *
     * @example
     * ```
     * viewer.getFieldOfView().then((fov) => { console.log(fov); });
     * ```
     */
    public getFieldOfView(): when.Promise<number> {
        return when.promise<number>(
            (resolve: (value: number) => void, reject: (reason: Error) => void): void => {
                this._container.renderService.renderCamera$.pipe(
                    first())
                    .subscribe(
                        (rc: RenderCamera): void => {
                            resolve(rc.perspective.fov);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Get the viewer's current point of view.
     *
     * @returns {Promise<IPointOfView>} Promise to the current point of view
     * of the viewer camera.
     *
     * @example
     * ```
     * viewer.getPointOfView().then((pov) => { console.log(pov); });
     * ```
     */
    public getPointOfView(): when.Promise<IPointOfView> {
        return when.promise<IPointOfView>(
            (resolve: (value: IPointOfView) => void, reject: (reason: Error) => void): void => {
                observableCombineLatest(
                    this._container.renderService.renderCamera$,
                    this._container.renderService.bearing$).pipe(
                        first())
                    .subscribe(
                        ([rc, bearing]: [RenderCamera, number]): void => {
                            resolve({
                                bearing: bearing,
                                tilt: rc.getTilt(),
                            });
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Get the viewer's current position
     *
     * @returns {Promise<ILatLon>} Promise to the viewers's current
     * position.
     *
     * @example
     * ```
     * viewer.getPosition().then((pos) => { console.log(pos); });
     * ```
     */
    public getPosition(): when.Promise<ILatLon> {
        return when.promise<ILatLon>(
            (resolve: (value: ILatLon) => void, reject: (reason: Error) => void): void => {
                observableCombineLatest(
                    this._container.renderService.renderCamera$,
                    this._navigator.stateService.reference$).pipe(
                        first())
                    .subscribe(
                        ([render, reference]: [RenderCamera, ILatLonAlt]): void => {
                            resolve(this._observer.projection.cameraToLatLon(render, reference));
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Get the image's current zoom level.
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
     * Navigate in a given direction.
     *
     * @description This method has to be called through EdgeDirection enumeration as in the example.
     *
     * @param {EdgeDirection} dir - Direction in which which to move.
     * @returns {Promise<Node>} Promise to the node that was navigated to.
     * @throws {Error} If the current node does not have the edge direction
     * or the edges has not yet been cached.
     * @throws {Error} Propagates any IO errors to the caller.
     * @throws {Error} When viewer is not navigable.
     * @throws  {@link AbortMapillaryError} When a subsequent move request is made
     * before the move dir call has completed.
     *
     * @example
     * ```
     * viewer.moveDir(Mapillary.EdgeDirection.Next).then(
     *     (n) => { console.log(n); },
     *     (e) => { console.error(e); });
     * ```
     */
    public moveDir(dir: EdgeDirection): when.Promise<Node> {
        const moveDir$: Observable<Node> = this.isNavigable ?
            this._navigator.moveDir$(dir) :
            observableThrowError(new Error("Calling moveDir is not supported when viewer is not navigable."));

        return when.promise<Node>(
            (resolve: (value: Node) => void, reject: (reason: Error) => void): void => {
                moveDir$.subscribe(
                    (node: Node): void => {
                        resolve(node);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
            });
    }

    /**
     * Navigate to a given image key.
     *
     * @param {string} key - A valid Mapillary image key.
     * @returns {Promise<Node>} Promise to the node that was navigated to.
     * @throws {Error} Propagates any IO errors to the caller.
     * @throws {Error} When viewer is not navigable.
     * @throws {@link AbortMapillaryError} When a subsequent move request is made
     * before the move to key call has completed.
     *
     * @example
     * ```
     * viewer.moveToKey("<my key>").then(
     *     (n) => { console.log(n); },
     *     (e) => { console.error(e); });
     * ```
     */
    public moveToKey(key: string): when.Promise<Node> {
        const moveToKey$: Observable<Node> = this.isNavigable ?
            this._navigator.moveToKey$(key) :
            observableThrowError(new Error("Calling moveToKey is not supported when viewer is not navigable."));

        return when.promise<Node>(
            (resolve: (value: Node) => void, reject: (reason: Error) => void): void => {
                moveToKey$.subscribe(
                    (node: Node): void => {
                        resolve(node);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
            });
    }

    /**
     * Project an ILatLon representing geographicalcoordinates to
     * canvas pixel coordinates.
     *
     * @description The geographical coordinates may not always correspond to pixel
     * coordinates, e.g. if the geographical coordinates have a position behind the
     * viewer camera. In the case of no correspondence the returned value will
     * be `null`.
     *
     * If the distance from the viewer camera position to the provided lat-lon
     * is more than 1000 meters `null` will be returned.
     *
     * The projection is performed from the ground plane, i.e.
     * the altitude with respect to the ground plane for the geographical
     * point is zero.
     *
     * Note that whenever the camera moves, the result of the method will be
     * different.
     *
     * @param {ILatLon} latLon - Geographical coordinates to project.
     * @returns {Promise<Array<number>>} Promise to the pixel coordinates corresponding
     * to the latLon.
     *
     * @example
     * ```
     * viewer.project({ lat: 0, lon: 0 })
     *     .then((pixelPoint) => {
     *          if (!pixelPoint) {
     *              console.log("no correspondence");
     *          }
     *
     *          console.log(pixelPoint);
     *     });
     * ```
     */
    public project(latLon: ILatLon): when.Promise<number[]> {
        return when.promise<number[]>(
            (resolve: (value: number[]) => void, reject: (reason: Error) => void): void => {
                this._observer.project$(latLon)
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
     * Project basic image coordinates for the current node to canvas pixel
     * coordinates.
     *
     * @description The basic image coordinates may not always correspond to a
     * pixel point that lies in the visible area of the viewer container. In the
     * case of no correspondence the returned value can be `null`.
     *
     *
     * @param {Array<number>} basicPoint - Basic images coordinates to project.
     * @returns {Promise<Array<number>>} Promise to the pixel coordinates corresponding
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
     * Clean up and release all internal resources associated with
     * this viewer.
     *
     * @description This includes DOM elements, event bindings, and
     * WebGL resources.
     *
     * Use this method when you are done using the viewer and wish to
     * ensure that it no longer consumes browser resources. Afterwards,
     * you must not call any other methods on the viewer.
     *
     * @fires Viewer#removed
     *
     * @example
     * ```
     * viewer.remove();
     * ```
     */
    public remove(): void {
        this._observer.dispose();
        this._componentController.remove();
        this._navigator.dispose();
        this._container.remove();

        this.fire(Viewer.removed, { type: Viewer.removed });
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
    }

    /**
     * Set a user bearer token for authenticated API requests of
     * protected resources.
     *
     * @description When the supplied user token is null or undefined,
     * any previously set user bearer token will be cleared and the
     * viewer will make unauthenticated requests.
     *
     * Calling setUserToken aborts all outstanding move requests.
     * The promises of those move requests will be rejected with a
     * {@link AbortMapillaryError} the rejections need to be caught.
     *
     * Calling setUserToken also resets the complete viewer cache
     * so it should not be called repeatedly.
     *
     * @param {string} [userToken] userToken - User bearer token.
     * @returns {Promise<void>} Promise that resolves after token
     * is set.
     *
     * @throws {Error} When viewer is not navigable.
     *
     * @example
     * ```
     * viewer.setUserToken("<my user token>")
     *     .then(() => { console.log("user token set"); });
     * ```
     */
    public setUserToken(userToken?: string): when.Promise<void> {
        const setUserToken$: Observable<void> = this.isNavigable ?
            this._navigator.setUserToken$(userToken) :
            observableThrowError(new Error("Calling setUserToken is not supported when viewer is not navigable."));

        return when.promise<void>(
            (resolve: (value: void) => void, reject: (reason: Error) => void): void => {
                setUserToken$
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
     * Set the basic coordinates of the current image to be in the
     * center of the viewport.
     *
     * @description Basic coordinates are 2D coordinates on the [0, 1] interval
     * and has the origin point, (0, 0), at the top left corner and the
     * maximum value, (1, 1), at the bottom right corner of the original
     * image.
     *
     * @param {number[]} The basic coordinates of the current
     * image to be at the center for the viewport.
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
     * A key must be a string that identifies a property name of a
     * simple {@link Node} property. A value must be a string, number, or
     * boolean. Strictly-typed comparisons are used. The values
     * `f0, ..., fn` of the combining filter must be filter expressions.
     *
     * Clear the filter by setting it to null or empty array.
     *
     * Commonly used filter properties (see the {@link Node} class
     * documentation for a full list of properties that can be used
     * in a filter) and common use cases:
     *
     * ```
     * fullPano        // Show only full 360 panoramas or not
     * organizationKey // Show images from one or several organizations
     * sequenceKey     // Show images from one or several sequences
     * userKey         // Show images from one or several users
     * capturedAt      // Show images from a certain time interval
     * ```
     *
     * @param {FilterExpression} filter - The filter expression.
     * @returns {Promise<void>} Promise that resolves after filter is applied.
     *
     * @example
     * ```
     * viewer.setFilter(["==", "sequenceKey", "<my sequence key>"]);
     *
     * // Other examples
     * // viewer.setFilter(["==", "organizationKey", "<my organization key>"]);
     * // viewer.setFilter(["in", "userKey", "<my user key #1>", "<my user key #2>"]);
     * // viewer.setFilter(["==", "fullPano", true]);
     * // viewer.setFilter([">=", "capturedAt", <my time stamp>]);
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
     * Set the viewer's current vertical field of view.
     *
     * @description Sets the vertical field of view rendered
     * on the viewer canvas measured in degrees. The value
     * will be clamped to be able to set a valid zoom level
     * based on the projection model of the current image and
     * the viewer's current render mode.
     *
     * @param {number} fov - Vertical field of view in degrees.
     *
     * @example
     * ```
     * viewer.setFieldOfView(45);
     * ```
     */
    public setFieldOfView(fov: number): void {
        this._container.renderService.renderCamera$.pipe(
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    const zoom: number = rc.fovToZoom(fov);
                    this._navigator.stateService.setZoom(zoom);
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
     * Set the viewer's transition mode.
     *
     * @param {TransitionMode} transitionMode - Transition mode.
     *
     * @example
     * ```
     * viewer.setTransitionMode(Mapillary.TransitionMode.Instantaneous);
     * ```
     */
    public setTransitionMode(transitionMode: TransitionMode): void {
        this._navigator.stateService.setTransitionMode(transitionMode);
    }

    /**
     * Set the image's current zoom level.
     *
     * @description Possible zoom level values are on the [0, 3] interval.
     * Zero means zooming out to fit the image to the view whereas three
     * shows the highest level of detail.
     *
     * @param {number} The image's current zoom level.
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
     * The unprojection to a latLon will be performed towards the ground plane, i.e.
     * the altitude with respect to the ground plane for the returned latLon is zero.
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
