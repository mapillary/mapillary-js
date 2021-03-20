import {
    combineLatest as observableCombineLatest,
    throwError as observableThrowError,
    Observable,
} from "rxjs";
import {
    first,
} from "rxjs/operators";

import { LatLon } from "../api/interfaces/LatLon";
import { Component } from "../component/Component";
import { ComponentConfiguration } from "../component/interfaces/ComponentConfiguration";
import { LatLonAlt } from "../api/interfaces/LatLonAlt";
import { FilterExpression } from "../graph/FilterExpression";
import { Node } from "../graph/Node";
import { NavigationDirection } from "../graph/edge/NavigationDirection";
import { RenderCamera } from "../render/RenderCamera";
import { RenderMode } from "../render/RenderMode";
import { TransitionMode } from "../state/TransitionMode";
import { EventEmitter } from "../utils/EventEmitter";
import { Settings } from "../utils/Settings";
import { Urls } from "../utils/Urls";

import { ICustomRenderer } from "./interfaces/ICustomRenderer";
import { PointOfView } from "./interfaces/PointOfView";
import { ViewerOptions } from "./interfaces/ViewerOptions";
import { ComponentController } from "./ComponentController";
import { Container } from "./Container";
import { Navigator } from "./Navigator";
import { Observer } from "./Observer";
import { CustomRenderer } from "./CustomRenderer";
/**
 * @class Viewer
 *
 * @classdesc The Viewer object represents the navigable image viewer.
 * Create a Viewer by specifying a container, client ID, image id and
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
     * moving, i.e. calling the `moveTo` and `moveDir`
     * methods. The viewer will not be in a navigable state if the cover
     * is activated and the viewer has been supplied a id. When the cover
     * is deactivated or activated without being supplied a id it will
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
     * Private custom renderer object which controls WebGL custom
     * rendering subscriptions.
     */
    private _customRenderer: CustomRenderer;

    /**
     * Create a new viewer instance.
     *
     * @description It is possible to initialize the viewer with or
     * without a id.
     *
     * When you want to show a specific image in the viewer from
     * the start you should initialize it with a id.
     *
     * When you do not know the first image id at implementation
     * time, e.g. in a map-viewer application you should initialize
     * the viewer without a id and call `moveTo` instead.
     *
     * When initializing with a id the viewer is bound to that id
     * until the node for that id has been successfully loaded.
     * Also, a cover with the image of the id will be shown.
     * If the data for that id can not be loaded because the id is
     * faulty or other errors occur it is not possible to navigate
     * to another id because the viewer is not navigable. The viewer
     * becomes navigable when the data for the id has been loaded and
     * the image is shown in the viewer. This way of initializing
     * the viewer is mostly for embedding in blog posts and similar
     * where one wants to show a specific image initially.
     *
     * If the viewer is initialized without a id (with null or
     * undefined) it is not bound to any particular id and it is
     * possible to move to any id with `viewer.moveTo("<my-image-id>")`.
     * If the first move to a id fails it is possible to move to another
     * id. The viewer will show a black background until a move
     * succeeds. This way of intitializing is suited for a map-viewer
     * application when the initial id is not known at implementation
     * time.
     *
     * @param {ViewerOptions} options - Optional configuration object
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
    constructor(options: ViewerOptions) {
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
            options.imageId,
            options.component);
        this._customRenderer = new CustomRenderer(this._container, this._navigator);
    }

    /**
     * Return a boolean indicating if the viewer is in a navigable state.
     *
     * @description The navigable state indicates if the viewer supports
     * moving, i.e. calling the {@link moveTo} and {@link moveDir}
     * methods or changing the authentication state,
     * i.e. calling {@link setUserToken}. The viewer will not be in a navigable
     * state if the cover is activated and the viewer has been supplied a id.
     * When the cover is deactivated or the viewer is activated without being
     * supplied a id it will be navigable.
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
     * Add a custom renderer to the viewer's rendering pipeline.
     *
     * @param renderer - The custom renderer implementation.
     */
    public addCustomRenderer(renderer: ICustomRenderer): void {
        this._customRenderer.add(renderer, this);
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
    public getBearing(): Promise<number> {
        return new Promise<number>(
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
     * Returns the viewer's <canvas> element.
     *
     * @description This is the element onto which the viewer renders
     * the WebGL content.
     *
     * @returns {HTMLCanvasElement} The viewer's <canvas> element, or
     * null or not initialized.
     */
    public getCanvas(): HTMLCanvasElement {
        return <HTMLCanvasElement>this._container.canvas;
    }

    /**
     * Returns the HTML element containing the viewer's <canvas> element.
     *
     * @description This is the element to which event bindings for viewer
     * interactivity (such as panning and zooming) are attached.
     *
     * @returns {HTMLDivElement} The container for the viewer's
     * <canvas> element.
     */
    public getCanvasContainer(): HTMLDivElement {
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
    public getCenter(): Promise<number[]> {
        return new Promise<number[]>(
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
    public getComponent<TComponent extends Component<ComponentConfiguration>>(name: string): TComponent {
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
    public getFieldOfView(): Promise<number> {
        return new Promise<number>(
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
     * @returns {Promise<PointOfView>} Promise to the current point of view
     * of the viewer camera.
     *
     * @example
     * ```
     * viewer.getPointOfView().then((pov) => { console.log(pov); });
     * ```
     */
    public getPointOfView(): Promise<PointOfView> {
        return new Promise<PointOfView>(
            (resolve: (value: PointOfView) => void, reject: (reason: Error) => void): void => {
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
     * @returns {Promise<LatLon>} Promise to the viewers's current
     * position.
     *
     * @example
     * ```
     * viewer.getPosition().then((pos) => { console.log(pos); });
     * ```
     */
    public getPosition(): Promise<LatLon> {
        return new Promise<LatLon>(
            (resolve: (value: LatLon) => void, reject: (reason: Error) => void): void => {
                observableCombineLatest(
                    this._container.renderService.renderCamera$,
                    this._navigator.stateService.reference$).pipe(
                        first())
                    .subscribe(
                        ([render, reference]: [RenderCamera, LatLonAlt]): void => {
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
    public getZoom(): Promise<number> {
        return new Promise<number>(
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
     * Check if a custom renderer has been added to the viewer's
     * rendering pipeline.
     *
     * @param {string} id - Unique id of the custom renderer.
     * @returns {boolean} Value indicating whether the customer
     * renderer has been added.
     */
    public hasCustomRenderer(id: string): boolean {
        return this._customRenderer.has(id);
    }

    /**
     * Navigate in a given direction.
     *
     * @description This method has to be called through EdgeDirection enumeration as in the example.
     *
     * @param {NavigationDirection} dir - Direction in which which to move.
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
    public moveDir(dir: NavigationDirection): Promise<Node> {
        const moveDir$: Observable<Node> = this.isNavigable ?
            this._navigator.moveDir$(dir) :
            observableThrowError(new Error("Calling moveDir is not supported when viewer is not navigable."));

        return new Promise<Node>(
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
     * Navigate to a given image id.
     *
     * @param {string} id - A valid Mapillary image id.
     * @returns {Promise<Node>} Promise to the node that was navigated to.
     * @throws {Error} Propagates any IO errors to the caller.
     * @throws {Error} When viewer is not navigable.
     * @throws {@link AbortMapillaryError} When a subsequent move request is made
     * before the move to id call has completed.
     *
     * @example
     * ```
     * viewer.moveTo("<my id>").then(
     *     (n) => { console.log(n); },
     *     (e) => { console.error(e); });
     * ```
     */
    public moveTo(id: string): Promise<Node> {
        const moveTo$: Observable<Node> = this.isNavigable ?
            this._navigator.moveTo$(id) :
            observableThrowError(new Error("Calling moveTo is not supported when viewer is not navigable."));

        return new Promise<Node>(
            (resolve: (value: Node) => void, reject: (reason: Error) => void): void => {
                moveTo$.subscribe(
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
     * @param {LatLon} latLon - Geographical coordinates to project.
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
    public project(latLon: LatLon): Promise<number[]> {
        return new Promise<number[]>(
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
    public projectFromBasic(basicPoint: number[]): Promise<number[]> {
        return new Promise<number[]>(
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
        this._customRenderer.dispose(this);
        this._observer.dispose();
        this._componentController.remove();
        this._navigator.dispose();
        this._container.remove();

        this.fire(Viewer.removed, { type: Viewer.removed });
    }

    /**
     * Remove a custom renderer from the viewer's rendering pipeline.
     *
     * @param id - Unique id of the custom renderer.
     */
    public removeCustomRenderer(id: string): void {
        this._customRenderer.remove(id, this);
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
    public setUserToken(userToken?: string): Promise<void> {
        const setUserToken$: Observable<void> = this.isNavigable ?
            this._navigator.setUserToken$(userToken) :
            observableThrowError(new Error("Calling setUserToken is not supported when viewer is not navigable."));

        return new Promise<void>(
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
     * cameraType      // Show only spherical or not
     * organizationId // Show images from one or several organizations
     * sequenceId     // Show images from one or several sequences
     * userId         // Show images from one or several users
     * capturedAt      // Show images from a certain time interval
     * ```
     *
     * @param {FilterExpression} filter - The filter expression.
     * @returns {Promise<void>} Promise that resolves after filter is applied.
     *
     * @example
     * ```
     * viewer.setFilter(["==", "sequenceId", "<my sequence id>"]);
     *
     * // Other examples
     * // viewer.setFilter(["==", "organizationId", "<my organization id>"]);
     * // viewer.setFilter(["in", "userId", "<my user id #1>", "<my user id #2>"]);
     * // viewer.setFilter(["==", "cameraType", "equirectangular"]);
     * // viewer.setFilter([">=", "capturedAt", <my time stamp>]);
     * ```
     */
    public setFilter(filter: FilterExpression): Promise<void> {
        return new Promise<void>(
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
     * Trigger the rendering of a single frame.
     *
     * @description Use this method with custom renderers to
     * force the viewer to rerender when the custom content
     * changes. Calling this multiple times before the next
     * frame is rendered will still result in only a single
     * frame being rendered.
     */
    public triggerRerender(): void {
        this._container.glRenderer.triggerRerender();
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
     * @returns {Promise<LatLon>} Promise to the latLon corresponding to the pixel point.
     *
     * @example
     * ```
     * viewer.unproject([100, 100])
     *     .then((latLon) => { console.log(latLon); });
     * ```
     */
    public unproject(pixelPoint: number[]): Promise<LatLon> {
        return new Promise<LatLon>(
            (resolve: (value: LatLon) => void, reject: (reason: Error) => void): void => {
                this._observer.unproject$(pixelPoint)
                    .subscribe(
                        (latLon: LatLon): void => {
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
     * @returns {Promise<LatLon>} Promise to the basic coordinates corresponding
     * to the pixel point.
     *
     * @example
     * ```
     * viewer.unprojectToBasic([100, 100])
     *     .then((basicPoint) => { console.log(basicPoint); });
     * ```
     */
    public unprojectToBasic(pixelPoint: number[]): Promise<number[]> {
        return new Promise<number[]>(
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
