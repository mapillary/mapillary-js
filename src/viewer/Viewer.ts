import {
    combineLatest as observableCombineLatest,
    throwError as observableThrowError,
    Observable,
} from "rxjs";
import {
    first,
} from "rxjs/operators";

import { LngLat } from "../api/interfaces/LngLat";
import { Component } from "../component/Component";
import { ComponentConfiguration }
    from "../component/interfaces/ComponentConfiguration";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { FilterExpression } from "../graph/FilterExpression";
import { Image } from "../graph/Image";
import { NavigationDirection } from "../graph/edge/NavigationDirection";
import { RenderCamera } from "../render/RenderCamera";
import { RenderMode } from "../render/RenderMode";
import { TransitionMode } from "../state/TransitionMode";
import { EventEmitter } from "../util/EventEmitter";
import { ICustomRenderer } from "./interfaces/ICustomRenderer";
import { PointOfView } from "./interfaces/PointOfView";
import { ViewerOptions } from "./options/ViewerOptions";
import { ComponentController } from "./ComponentController";
import { Container } from "./Container";
import { Navigator } from "./Navigator";
import { Observer } from "./Observer";
import { CustomRenderer } from "./CustomRenderer";
import { IViewer } from "./interfaces/IViewer";
import { ViewerBearingEvent } from "./events/ViewerBearingEvent";
import { ViewerEventType } from "./events/ViewerEventType";
import { ViewerDataLoadingEvent } from "./events/ViewerDataLoadingEvent";
import { ViewerMouseEvent } from "./events/ViewerMouseEvent";
import { ViewerNavigableEvent } from "./events/ViewerNavigableEvent";
import { ViewerNavigationEdgeEvent }
    from "./events/ViewerNavigationEdgeEvent";
import { ViewerImageEvent } from "./events/ViewerImageEvent";
import { ViewerStateEvent } from "./events/ViewerStateEvent";
import { ComponentName } from "../component/ComponentName";
import { FallbackComponentName }
    from "../component/fallback/FallbackComponentName";
import { CameraControls } from "./enums/CameraControls";
import { State } from "../state/State";
import { ICustomCameraControls } from "./interfaces/ICustomCameraControls";
import { CustomCameraControls } from "./CustomCameraControls";
import { ViewerLoadEvent } from "./events/ViewerLoadEvent";
import { cameraControlsToState } from "./Modes";
import { ViewerReferenceEvent } from "./events/ViewerReferenceEvent";
import { IDataProvider } from "../external/api";

/**
 * @class Viewer
 *
 * @classdesc The Viewer object represents the navigable image viewer.
 * Create a Viewer by specifying a container, client ID, image ID and
 * other options. The viewer exposes methods and events for programmatic
 * interaction.
 *
 * In the case of asynchronous methods, MapillaryJS returns promises to
 * the results. Notifications are always emitted through JavaScript events.
 */
export class Viewer extends EventEmitter implements IViewer {
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
     * Private navigator object which controls navigation.
     */
    private _navigator: Navigator;

    /**
     * Private custom camera controls object which handles
     * custom control subscriptions.
     */
    private _customCameraControls: CustomCameraControls;

    /**
     * Private custom renderer object which controls WebGL custom
     * rendering subscriptions.
     */
    private _customRenderer: CustomRenderer;

    /**
     * Create a new viewer instance.
     *
     * @description The `Viewer` object represents the street imagery
     * viewer on your web page. It exposes methods and properties that
     * you can use to programatically change the view, and fires
     * events as users interact with it.
     *
     * It is possible to initialize the viewer with or
     * without a ID.
     *
     * When you want to show a specific image in the viewer from
     * the start you should initialize it with a ID.
     *
     * When you do not know the first image ID at implementation
     * time, e.g. in a map-viewer application you should initialize
     * the viewer without a ID and call `moveTo` instead.
     *
     * When initializing with an ID the viewer is bound to that ID
     * until the image for that ID has been successfully loaded.
     * Also, a cover with the image of the ID will be shown.
     * If the data for that ID can not be loaded because the ID is
     * faulty or other errors occur it is not possible to navigate
     * to another ID because the viewer is not navigable. The viewer
     * becomes navigable when the data for the ID has been loaded and
     * the image is shown in the viewer. This way of initializing
     * the viewer is mostly for embedding in blog posts and similar
     * where one wants to show a specific image initially.
     *
     * If the viewer is initialized without a ID (with null or
     * undefined) it is not bound to any particular ID and it is
     * possible to move to any ID with `viewer.moveTo("<my-image-id>")`.
     * If the first move to a ID fails it is possible to move to another
     * ID. The viewer will show a black background until a move
     * succeeds. This way of intitializing is suited for a map-viewer
     * application when the initial ID is not known at implementation
     * time.
     *
     * @param {ViewerOptions} options - Optional configuration object
     * specifying Viewer's and the components' initial setup.
     *
     * @example
     * ```js
     * var viewer = new Viewer({
     *     accessToken: "<my-access-token>",
     *     container: "<my-container-id>",
     * });
     * ```
     */
    constructor(options: ViewerOptions) {
        super();

        this._navigator =
            new Navigator(options);

        this._container =
            new Container(
                options,
                this._navigator.stateService);

        this._observer =
            new Observer(
                this,
                this._navigator,
                this._container);

        this._componentController =
            new ComponentController(
                this._container,
                this._navigator,
                this._observer,
                options.imageId,
                options.component);

        this._customRenderer =
            new CustomRenderer(
                this._container,
                this._navigator);

        this._customCameraControls =
            new CustomCameraControls(
                this._container,
                this._navigator);
    }

    /**
     * Returns the data provider used by the viewer to fetch
     * all contracts, ents, and buffers.
     *
     * @description The viewer's data provider can be set
     * upon initialization through the {@link ViewerOptions.dataProvider}
     * property.
     *
     * @returns {IDataProvider} The viewer's data provider.
     */
    public get dataProvider(): IDataProvider {
        return this._navigator.api.data;
    }

    /**
     * Return a boolean indicating if the viewer is in a navigable state.
     *
     * @description The navigable state indicates if the viewer supports
     * moving, i.e. calling the {@link moveTo} and {@link moveDir}
     * methods or changing the authentication state,
     * i.e. calling {@link setAccessToken}. The viewer will not be in a navigable
     * state if the cover is activated and the viewer has been supplied a ID.
     * When the cover is deactivated or the viewer is activated without being
     * supplied a ID it will be navigable.
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
     * @param {ComponentName | FallbackComponentName} name - Name of
     * the component which will become active.
     *
     * @example
     * ```js
     * viewer.activateComponent("marker");
     * ```
     */
    public activateComponent(
        name: ComponentName | FallbackComponentName): void {
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
     * @description During a render pass, custom renderers
     * are called in the order they were added.
     *
     * @param renderer - The custom renderer implementation.
     */
    public addCustomRenderer(renderer: ICustomRenderer): void {
        this._customRenderer.add(renderer, this);
    }

    /**
     * Attach custom camera controls to control the viewer's
     * camera pose and projection.
     *
     * @description Custom camera controls allow the API user
     * to move the viewer's camera freely and define the camera
     * projection. These camera properties are used
     * to render the viewer 3D scene directly into the
     * viewer's GL context.
     *
     * Only a single custom camera control instance can be
     * attached to the viewer. A new custom camera control
     * instance can be attached after detaching a previous
     * one.
     *
     * Set the viewer's camera controls to
     * {@link CameraControls.Custom} to activate attached
     * camera controls. If {@link CameraControls.Custom}
     * has already been set when a custom camera control
     * instance is attached, it will be activated immediately.
     *
     * Set the viewer's camera controls to any other
     * {@link CameraControls} mode to deactivate the
     * custom camera controls.
     *
     * @param controls - The custom camera controls implementation.
     *
     * @throws {MapillaryError} When camera controls attached
     * are already attached to the viewer.
     */
    public attachCustomCameraControls(controls: ICustomCameraControls): void {
        this._customCameraControls.attach(controls, this);
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
     * @param {ComponentName | FallbackComponentName} name - Name
     * of component which become inactive.
     *
     * @example
     * ```js
     * viewer.deactivateComponent("pointer");
     * ```
     */
    public deactivateComponent(
        name: ComponentName | FallbackComponentName): void {
        this._componentController.deactivate(name);
    }

    /**
     * Deactivate the cover (activates all components marked as active).
     */
    public deactivateCover(): void {
        this._componentController.deactivateCover();
    }

    /**
     * Detach a previously attached custom camera control
     * instance from the viewer.
     *
     * @description If no custom camera control instance
     * has previously been attached, calling this method
     * has no effect.
     *
     * Already attached custom camera controls need to
     * be detached before attaching another custom camera
     * control instance.
     */
    public detachCustomCameraControls(): Promise<ICustomCameraControls> {
        return this._customCameraControls.detach(this);
    }

    public fire(
        type: ViewerBearingEvent["type"],
        event: ViewerBearingEvent)
        : void;
    public fire(
        type: ViewerDataLoadingEvent["type"],
        event: ViewerDataLoadingEvent)
        : void;
    public fire(
        type: ViewerNavigableEvent["type"],
        event: ViewerNavigableEvent)
        : void;
    public fire(
        type: ViewerImageEvent["type"],
        event: ViewerImageEvent)
        : void;
    public fire(
        type: ViewerNavigationEdgeEvent["type"],
        event: ViewerNavigationEdgeEvent)
        : void;
    public fire(
        type: ViewerReferenceEvent["type"],
        event: ViewerReferenceEvent)
        : void;
    public fire(
        type: ViewerStateEvent["type"],
        event: ViewerStateEvent)
        : void;
    public fire(
        type: ViewerMouseEvent["type"],
        event: ViewerMouseEvent)
        : void;
    public fire<T>(
        type: ViewerEventType,
        event: T)
        : void {
        super.fire(type, event);
    }

    /**
     * Get the bearing of the current viewer camera.
     *
     * @description The bearing depends on how the camera
     * is currently rotated and does not correspond
     * to the compass angle of the current image if the view
     * has been panned.
     *
     * Bearing is measured in degrees clockwise with respect to
     * north.
     *
     * @returns {Promise<number>} Promise to the bearing
     * of the current viewer camera.
     *
     * @example
     * ```js
     * viewer.getBearing().then(b => { console.log(b); });
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
     * Get the viewer's camera control mode.
     *
     * @description The camera control mode determines
     * how the camera is controlled when the viewer
     * receives pointer and keyboard input.
     *
     * @returns {CameraControls} controls - Camera control mode.
     *
     * @example
     * ```js
     * viewer.getCameraControls().then(c => { console.log(c); });
     * ```
     */
    public getCameraControls(): Promise<CameraControls> {
        return new Promise<number>((
            resolve: (value: CameraControls) => void,
            reject: (reason: Error) => void)
            : void => {
            this._navigator.stateService.state$.pipe(
                first())
                .subscribe(
                    (state: State): void => {
                        switch (state) {
                            case State.Custom:
                                resolve(CameraControls.Custom);
                                break;
                            case State.Earth:
                                resolve(CameraControls.Earth);
                                break;
                            default:
                                resolve(CameraControls.Street);
                                break;
                        }
                    },
                    (error: Error): void => {
                        reject(error);
                    });
        });
    }

    /**
     * Returns the viewer's canvas element.
     *
     * @description This is the element onto which the viewer renders
     * the WebGL content.
     *
     * @returns {HTMLCanvasElement} The viewer's canvas element, or
     * null or not initialized.
     */
    public getCanvas(): HTMLCanvasElement {
        return <HTMLCanvasElement>this._container.canvas;
    }

    /**
     * Returns the HTML element containing the viewer's canvas element.
     *
     * @description This is the element to which event bindings for viewer
     * interactivity (such as panning and zooming) are attached.
     *
     * @returns {HTMLDivElement} The container for the viewer's
     * canvas element.
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
     * ```js
     * viewer.getCenter().then(c => { console.log(c); });
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
     * ```js
     * var pointerComponent = viewer.getComponent("pointer");
     * ```
     */
    public getComponent<TComponent extends Component<ComponentConfiguration>>(
        name: ComponentName | FallbackComponentName): TComponent {
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
     * ```js
     * viewer.getFieldOfView().then(fov => { console.log(fov); });
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
     * Get the viewer's current image.
     *
     * @returns {Promise<Image>} Promise to the current image.
     *
     * @example
     * ```js
     * viewer.getImage().then(image => { console.log(image.id); });
     * ```
     */
    public getImage(): Promise<Image> {
        return new Promise<Image>(
            (resolve: (image: Image) => void, reject: (reason: Error) => void): void => {
                this._navigator.stateService.currentImage$.pipe(
                    first())
                    .subscribe(
                        (image) => { resolve(image); },
                        (error) => { reject(error); });
            }
        );
    }

    /**
     * Get the viewer's current point of view.
     *
     * @returns {Promise<PointOfView>} Promise to the current point of view
     * of the viewer camera.
     *
     * @example
     * ```js
     * viewer.getPointOfView().then(pov => { console.log(pov); });
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
     * @returns {Promise<LngLat>} Promise to the viewers's current
     * position.
     *
     * @example
     * ```js
     * viewer.getPosition().then(pos => { console.log(pos); });
     * ```
     */
    public getPosition(): Promise<LngLat> {
        return new Promise<LngLat>(
            (resolve: (value: LngLat) => void, reject: (reason: Error) => void): void => {
                observableCombineLatest(
                    this._container.renderService.renderCamera$,
                    this._navigator.stateService.reference$).pipe(
                        first())
                    .subscribe(
                        ([render, reference]: [RenderCamera, LngLatAlt]): void => {
                            resolve(this._observer.projection.cameraToLngLat(render, reference));
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Get the viewer's current reference position.
     *
     * @description The reference position specifies the origin in
     * the viewer's topocentric coordinate system.
     *
     * @returns {Promise<LngLatAlt>} Promise to the reference position.
     *
     * @example
     * ```js
     * viewer.getReference().then(reference => { console.log(reference); });
     * ```
     */
    public getReference(): Promise<LngLatAlt> {
        return new Promise<LngLatAlt>(
            (resolve: (reference: LngLatAlt) => void, reject: (reason: Error) => void): void => {
                this._navigator.stateService.reference$.pipe(
                    first())
                    .subscribe(
                        (reference) => { resolve(reference); },
                        (error) => { reject(error); });
            }
        );
    }

    /**
     * Get the image's current zoom level.
     *
     * @returns {Promise<number>} Promise to the viewers's current
     * zoom level.
     *
     * @example
     * ```js
     * viewer.getZoom().then(z => { console.log(z); });
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
     * Check if a controls instance is the camera controls that are
     * currently attached to the viewer.
     *
     * @param {ICustomCameraControls} controls - Camera controls instance.
     * @returns {boolean} Value indicating whether the controls instance
     * is currently attached.
     */
    public hasCustomCameraControls(controls: ICustomCameraControls): boolean {
        return this._customCameraControls.has(controls);
    }

    /**
     * Check if a custom renderer has been added to the viewer's
     * rendering pipeline.
     *
     * @param {string} id - Unique ID of the custom renderer.
     * @returns {boolean} Value indicating whether the customer
     * renderer has been added.
     */
    public hasCustomRenderer(rendererId: string): boolean {
        return this._customRenderer.has(rendererId);
    }

    /**
     * Navigate in a given direction.
     *
     * @param {NavigationDirection} direction - Direction in which which to move.
     * @returns {Promise<Image>} Promise to the image that was navigated to.
     * @throws If the current image does not have the edge direction
     * or the edges has not yet been cached.
     * @throws Propagates any IO errors to the caller.
     * @throws When viewer is not navigable.
     * @throws {@link CancelMapillaryError} When a subsequent move request
     * is made before the move dir call has completed.
     *
     * @example
     * ```js
     * viewer.moveDir(NavigationDirection.Next).then(
     *     image => { console.log(image); },
     *     error => { console.error(error); });
     * ```
     */
    public moveDir(direction: NavigationDirection): Promise<Image> {
        const moveDir$: Observable<Image> = this.isNavigable ?
            this._navigator.moveDir$(direction) :
            observableThrowError(new Error("Calling moveDir is not supported when viewer is not navigable."));

        return new Promise<Image>(
            (resolve: (value: Image) => void, reject: (reason: Error) => void): void => {
                moveDir$.subscribe(
                    (image: Image): void => {
                        resolve(image);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
            });
    }

    /**
     * Navigate to a given image ID.
     *
     * @param {string} imageId - Id of the image to move to.
     * @returns {Promise<Image>} Promise to the image that was navigated to.
     * @throws Propagates any IO errors to the caller.
     * @throws When viewer is not navigable.
     * @throws {@link CancelMapillaryError} When a subsequent
     * move request is made before the move to ID call has completed.
     *
     * @example
     * ```js
     * viewer.moveTo("<my-image-id>").then(
     *     image => { console.log(image); },
     *     error => { console.error(error); });
     * ```
     */
    public moveTo(imageId: string): Promise<Image> {
        const moveTo$: Observable<Image> = this.isNavigable ?
            this._navigator.moveTo$(imageId) :
            observableThrowError(new Error("Calling moveTo is not supported when viewer is not navigable."));

        return new Promise<Image>(
            (resolve: (value: Image) => void, reject: (reason: Error) => void): void => {
                moveTo$.subscribe(
                    (image: Image): void => {
                        resolve(image);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
            });
    }

    public off(
        type: ViewerBearingEvent["type"],
        handler: (event: ViewerBearingEvent) => void)
        : void;
    public off(
        type: ViewerDataLoadingEvent["type"],
        handler: (event: ViewerDataLoadingEvent) => void)
        : void;
    public off(
        type: ViewerNavigableEvent["type"],
        handler: (event: ViewerNavigableEvent) => void)
        : void;
    public off(
        type: ViewerImageEvent["type"],
        handler: (event: ViewerImageEvent) => void)
        : void;
    public off(
        type: ViewerNavigationEdgeEvent["type"],
        handler: (event: ViewerNavigationEdgeEvent) => void)
        : void;
    public off(
        type: ViewerReferenceEvent["type"],
        handler: (event: ViewerReferenceEvent) => void)
        : void;
    public off(
        type: ViewerStateEvent["type"],
        handler: (event: ViewerStateEvent) => void)
        : void;
    public off(
        type: ViewerMouseEvent["type"],
        handler: (event: ViewerMouseEvent) => void)
        : void;
    public off<T>(
        type: ViewerEventType,
        handler: (event: T) => void)
        : void {
        super.off(type, handler);
    }

    /**
     * Fired when the viewing direction of the camera changes.
     *
     * @event bearing
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("bearing", function() {
     *   console.log("A bearing event has occurred.");
     * });
     * ```
     */
    public on(
        type: "bearing",
        handler: (event: ViewerBearingEvent) => void)
        : void;
    /**
     * Fired when a pointing device (usually a mouse) is
     * pressed and released at the same point in the viewer.
     *
     * @event click
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("click", function() {
     *   console.log("A click event has occurred.");
     * });
     * ```
     */
    public on(
        type: "click",
        handler: (event: ViewerMouseEvent) => void)
        : void;
    /**
     * Fired when the right button of the mouse is clicked
     * within the viewer.
     *
     * @event contextmenu
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("contextmenu", function() {
     *   console.log("A contextmenu event has occurred.");
     * });
     * ```
     */
    public on(
        type: "contextmenu",
        handler: (event: ViewerMouseEvent) => void)
        : void;
    /**
     * Fired when the viewer is loading data.
     *
     * @event loading
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("dataloading", function() {
     *   console.log("A loading event has occurred.");
     * });
     * ```
     */
    public on(
        type: "dataloading",
        handler: (event: ViewerDataLoadingEvent) => void)
        : void;
    /**
     * Fired when a pointing device (usually a mouse) is clicked twice at
     * the same point in the viewer.
     *
     * @event dblclick
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("dblclick", function() {
     *   console.log("A dblclick event has occurred.");
     * });
     * ```
     */
    public on(
        type: "dblclick",
        handler: (event: ViewerMouseEvent) => void)
        : void;
    /**
     * Fired when the viewer's vertical field of view changes.
     *
     * @event fov
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("fov", function() {
     *   console.log("A fov event has occurred.");
     * });
     * ```
     */
    public on(
        type: "fov",
        handler: (event: ViewerStateEvent) => void)
        : void;
    /**
     * Fired immediately after all necessary resources
     * have been downloaded and the first visually complete
     * rendering of the viewer has occurred.
     *
     * This event is only fired for viewer configurations where
     * the WebGL context is created, i.e. not when using the
     * fallback functionality only.
     *
     * @event load
     * @example
     * @example
     * ```js
     * // Set an event listener
     * viewer.on('load', function(event) {
     *   console.log('A load event has occured');
     * });
     * ```
     */
    public on(
        type: "load",
        handler: (event: ViewerLoadEvent) => void)
        : void;
    /**
     * Fired when a pointing device (usually a mouse) is pressed
     * within the viewer.
     *
     * @event mousedown
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mousedown", function() {
     *   console.log("A mousedown event has occurred.");
     * });
     * ```
     */
    public on(
        type: "mousedown",
        handler: (event: ViewerMouseEvent) => void)
        : void;
    /**
     * Fired when a pointing device (usually a mouse)
     * is moved within the viewer.
     *
     * @event mousemove
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mousemove", function() {
     *   console.log("A mousemove event has occurred.");
     * });
     * ```
     */
    public on(
        type: "mousemove",
        handler: (event: ViewerMouseEvent) => void)
        : void;
    /**
     * Fired when a pointing device (usually a mouse)
     * leaves the viewer's canvas.
     *
     * @event mouseout
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseout", function() {
     *   console.log("A mouseout event has occurred.");
     * });
     * ```
     */
    public on(
        type: "mouseout",
        handler: (event: ViewerMouseEvent) => void)
        : void;
    /**
     * Fired when a pointing device (usually a mouse)
     * is moved onto the viewer's canvas.
     *
     * @event mouseover
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseover", function() {
     *   console.log("A mouseover event has occurred.");
     * });
     * ```
     */
    public on(
        type: "mouseover",
        handler: (event: ViewerMouseEvent) => void)
        : void;
    /**
     * Fired when a pointing device (usually a mouse)
     * is released within the viewer.
     *
     * @event mouseup
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseup", function() {
     *   console.log("A mouseup event has occurred.");
     * });
     * ```
     */
    public on(
        type: "mouseup",
        handler: (event: ViewerMouseEvent) => void)
        : void;
    /**
     * Fired when the viewer motion stops and it is in a fixed
     * position with a fixed point of view.
     *
     * @event moveend
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("moveend", function() {
     *   console.log("A moveend event has occurred.");
     * });
     * ```
     */
    public on(
        type: "moveend",
        handler: (event: ViewerStateEvent) => void)
        : void;
    /**
     * Fired when the motion from one view to another start,
     * either by changing the position (e.g. when changing image)
     * or when changing point of view
     * (e.g. by interaction such as pan and zoom).
     *
     * @event movestart
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("movestart", function() {
     *   console.log("A movestart event has occurred.");
     * });
     * ```
     */
    public on(
        type: "movestart",
        handler: (event: ViewerStateEvent) => void)
        : void;
    /**
     * Fired when the navigable state of the viewer changes.
     *
     * @event navigable
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("navigable", function() {
     *   console.log("A navigable event has occurred.");
     * });
     * ```
     */
    public on(
        type: "navigable",
        handler: (event: ViewerNavigableEvent) => void)
        : void;
    /**
     * Fired every time the viewer navigates to a new image.
     *
     * @event image
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("image", function() {
     *   console.log("A image event has occurred.");
     * });
     * ```
     */
    public on(
        type: "image",
        handler: (event: ViewerImageEvent) => void)
        : void;
    /**
     * Fired when the viewer's position changes.
     *
     * @description The viewer's position changes when transitioning
     * between images.
     *
     * @event position
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("position", function() {
     *   console.log("A position event has occurred.");
     * });
     * ```
     */
    public on(
        type: "position",
        handler: (event: ViewerStateEvent) => void)
        : void;
    /**
     * Fired when the viewer's point of view changes. The
     * point of view changes when the bearing, or tilt changes.
     *
     * @event pov
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("pov", function() {
     *   console.log("A pov event has occurred.");
     * });
     * ```
     */
    public on(
        type: "pov",
        handler: (event: ViewerStateEvent) => void)
        : void;
    /**
     * Fired when the viewer's reference position changes.
     *
     * The reference position specifies the origin in
     * the viewer's topocentric coordinate system.
     *
     * @event reference
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("reference", function(reference) {
     *   console.log("A reference event has occurred.");
     * });
     * ```
     */
    public on(
        type: "reference",
        handler: (event: ViewerReferenceEvent) => void)
        : void;
    /**
     * Fired when the viewer is removed. After this event is emitted
     * you must not call any methods on the viewer.
     *
     * @event remove
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("remove", function() {
     *   console.log("A remove event has occurred.");
     * });
     * ```
     */
    public on(
        type: "remove",
        handler: (event: ViewerStateEvent) => void)
        : void;
    /**
     * Fired every time the sequence edges of the current image changes.
     *
     * @event sequenceedges
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("sequenceedges", function() {
     *   console.log("A sequenceedges event has occurred.");
     * });
     * ```
     */
    public on(
        type: "sequenceedges",
        handler: (event: ViewerNavigationEdgeEvent) => void)
        : void;
    /**
     * Fired every time the spatial edges of the current image changes.
     *
     * @event spatialedges
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("spatialedges", function() {
     *   console.log("A spatialedges event has occurred.");
     * });
     * ```
     */
    public on(
        type: "spatialedges",
        handler: (event: ViewerNavigationEdgeEvent) => void)
        : void;
    public on<T>(
        type: ViewerEventType,
        handler: (event: T) => void)
        : void {
        super.on(type, handler);
    }

    /**
     * Project geodetic coordinates to canvas pixel coordinates.
     *
     * @description The geodetic coordinates may not always correspond to pixel
     * coordinates, e.g. if the geodetic coordinates have a position behind the
     * viewer camera. In the case of no correspondence the returned value will
     * be `null`.
     *
     * If the distance from the viewer camera position to the provided
     * longitude-latitude is more than 1000 meters `null` will be returned.
     *
     * The projection is performed from the ground plane, i.e.
     * the altitude with respect to the ground plane for the geodetic
     * point is zero.
     *
     * Note that whenever the camera moves, the result of the method will be
     * different.
     *
     * @param {LngLat} lngLat - Geographical coordinates to project.
     * @returns {Promise<Array<number>>} Promise to the pixel coordinates corresponding
     * to the lngLat.
     *
     * @example
     * ```js
     * viewer.project({ lat: 0, lng: 0 })
     *     .then(pixelPoint => {
     *          if (!pixelPoint) {
     *              console.log("no correspondence");
     *          }
     *
     *          console.log(pixelPoint);
     *     });
     * ```
     */
    public project(lngLat: LngLat): Promise<number[]> {
        return new Promise<number[]>(
            (resolve: (value: number[]) => void, reject: (reason: Error) => void): void => {
                this._observer.project$(lngLat)
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
     * Project basic image coordinates for the current image to canvas pixel
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
     * ```js
     * viewer.projectFromBasic([0.3, 0.7])
     *     .then(pixelPoint => { console.log(pixelPoint); });
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
     * @fires remove
     *
     * @example
     * ```js
     * viewer.remove();
     * ```
     */
    public remove(): void {
        this._customRenderer.dispose(this);
        this._customCameraControls.dispose(this);
        this._observer.dispose();
        this._componentController.remove();
        this._navigator.dispose();
        this._container.remove();

        const type: ViewerEventType = "remove";
        const event: ViewerStateEvent = {
            target: this,
            type,
        };
        this.fire(type, event);
    }

    /**
     * Remove a custom renderer from the viewer's rendering pipeline.
     *
     * @param id - Unique ID of the custom renderer.
     */
    public removeCustomRenderer(rendererId: string): void {
        this._customRenderer.remove(rendererId, this);
    }

    /**
     * Detect the viewer's new width and height and resize it
     * manually.
     *
     * @description The components will also detect the viewer's
     * new size and resize their rendered elements if needed.
     *
     * When the {@link ViewerOptions.trackResize} option is
     * set to true, the viewer will automatically resize
     * when the browser window is resized. If any other
     * custom behavior is preferred, the option should be set
     * to false and the {@link Viewer.resize} method should
     * be called on demand.
     *
     * @example
     * ```js
     * viewer.resize();
     * ```
     */
    public resize(): void {
        this._container.renderService.resize$.next();
    }

    /**
     * Set the viewer's camera control mode.
     *
     * @description The camera control mode determines
     * how the camera is controlled when the viewer
     * receives pointer and keyboard input.
     *
     * Changing the camera control mode is not possible
     * when the slider component is active and attempts
     * to do so will be ignored.
     *
     * @param {CameraControls} controls - Camera control mode.
     *
     * @example
     * ```js
     * viewer.setCameraControls(CameraControls.Street);
     * ```
     */
    public setCameraControls(controls: CameraControls): void {
        const state = cameraControlsToState(controls);
        if (state === State.Traversing) {
            this._navigator.stateService.traverse();
        } else if (state === State.Earth) {
            this._navigator.stateService.earth();
        } else if (state === State.Custom) {
            this._navigator.stateService.custom();
        } else {
            console.warn(
                `Unsupported camera control transition (${controls})`);
        }
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
     * ```js
     * viewer.setCenter([0.5, 0.5]);
     * ```
     */
    public setCenter(center: number[]): void {
        this._navigator.stateService.setCenter(center);
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
     * ```js
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
     * Set the filter selecting images to use when calculating
     * the spatial edges.
     *
     * @description The following filter types are supported:
     *
     * Comparison
     *
     * `["==", key, value]` equality: `image[key] = value`
     *
     * `["!=", key, value]` inequality: `image[key] ≠ value`
     *
     * `["<", key, value]` less than: `image[key] < value`
     *
     * `["<=", key, value]` less than or equal: `image[key] ≤ value`
     *
     * `[">", key, value]` greater than: `image[key] > value`
     *
     * `[">=", key, value]` greater than or equal: `image[key] ≥ value`
     *
     * Set membership
     *
     * `["in", key, v0, ..., vn]` set inclusion: `image[key] ∈ {v0, ..., vn}`
     *
     * `["!in", key, v0, ..., vn]` set exclusion: `image[key] ∉ {v0, ..., vn}`
     *
     * Combining
     *
     * `["all", f0, ..., fn]` logical `AND`: `f0 ∧ ... ∧ fn`
     *
     * A key must be a string that identifies a property name of a
     * simple {@link Image} property, i.e. a key of the {@link FilterKey}
     * type. A value must be a string, number, or
     * boolean. Strictly-typed comparisons are used. The values
     * `f0, ..., fn` of the combining filter must be filter expressions.
     *
     * Clear the filter by setting it to null or empty array.
     *
     * Commonly used filter properties (see the {@link Image} class
     * documentation for a full list of properties that can be used
     * in a filter) are shown the the example code.
     *
     * @param {FilterExpression} [filter] - The filter expression.
     * Applied filter is cleared if omitted.
     * @returns {Promise<void>} Promise that resolves after filter is applied.
     *
     * @example
     * ```js
     * // Examples
     * viewer.setFilter(["==", "cameraType", "spherical"]);
     * viewer.setFilter([">=", "capturedAt", <my-time-stamp>]);
     * viewer.setFilter(["in", "sequenceId", "<sequence-id-1>", "<sequence-id-2>"]);
     * ```
     */
    public setFilter(filter?: FilterExpression): Promise<void> {
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
     * Set the viewer's render mode.
     *
     * @param {RenderMode} renderMode - Render mode.
     *
     * @example
     * ```js
     * viewer.setRenderMode(RenderMode.Letterbox);
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
     * ```js
     * viewer.setTransitionMode(TransitionMode.Instantaneous);
     * ```
     */
    public setTransitionMode(transitionMode: TransitionMode): void {
        this._navigator.stateService.setTransitionMode(transitionMode);
    }

    /**
     * Set an access token for authenticated API requests of protected
     * resources.
     *
     * The token may be a user access token or a client access token.
     *
     * @description When the supplied user token is null or undefined,
     * any previously set user bearer token will be cleared and the
     * viewer will make unauthenticated requests.
     *
     * Calling setAccessToken aborts all outstanding move requests.
     * The promises of those move requests will be rejected with a
     * {@link CancelMapillaryError} the rejections need to be caught.
     *
     * Calling setAccessToken also resets the complete viewer cache
     * so it should not be called repeatedly.
     *
     * @param {string} [accessToken] accessToken - Optional user
     * access token or client access token.
     * @returns {Promise<void>} Promise that resolves after token
     * is set.
     *
     * @throws When viewer is not navigable.
     *
     * @example
     * ```js
     * viewer.setAccessToken("<my access token>")
     *     .then(() => { console.log("user token set"); });
     * ```
     */
    public setAccessToken(accessToken?: string): Promise<void> {
        const setAccessToken$: Observable<void> = this.isNavigable ?
            this._navigator.setAccessToken$(accessToken) :
            observableThrowError(new Error("Calling setAccessToken is not supported when viewer is not navigable."));

        return new Promise<void>(
            (resolve: (value: void) => void, reject: (reason: Error) => void): void => {
                setAccessToken$
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
     * Set the image's current zoom level.
     *
     * @description Possible zoom level values are on the [0, 3] interval.
     * Zero means zooming out to fit the image to the view whereas three
     * shows the highest level of detail.
     *
     * @param {number} The image's current zoom level.
     *
     * @example
     * ```js
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
     * Unproject canvas pixel coordinates to geodetic
     * coordinates.
     *
     * @description The pixel point may not always correspond to geodetic
     * coordinates. In the case of no correspondence the returned value will
     * be `null`.
     *
     * The unprojection to a lngLat will be performed towards the ground plane, i.e.
     * the altitude with respect to the ground plane for the returned lngLat is zero.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates to unproject.
     * @returns {Promise<LngLat>} Promise to the lngLat corresponding to the pixel point.
     *
     * @example
     * ```js
     * viewer.unproject([100, 100])
     *     .then(lngLat => { console.log(lngLat); });
     * ```
     */
    public unproject(pixelPoint: number[]): Promise<LngLat> {
        return new Promise<LngLat>(
            (resolve: (value: LngLat) => void, reject: (reason: Error) => void): void => {
                this._observer.unproject$(pixelPoint)
                    .subscribe(
                        (lngLat: LngLat): void => {
                            resolve(lngLat);
                        },
                        (error: Error): void => {
                            reject(error);
                        });
            });
    }

    /**
     * Unproject canvas pixel coordinates to basic image coordinates for the
     * current image.
     *
     * @description The pixel point may not always correspond to basic image
     * coordinates. In the case of no correspondence the returned value will
     * be `null`.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates to unproject.
     * @returns {Promise<LngLat>} Promise to the basic coordinates corresponding
     * to the pixel point.
     *
     * @example
     * ```js
     * viewer.unprojectToBasic([100, 100])
     *     .then(basicPoint => { console.log(basicPoint); });
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
