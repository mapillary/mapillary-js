import * as THREE from "three";

import {
    combineLatest as observableCombineLatest,
    concat as observableConcat,
    merge as observableMerge,
    of as observableOf,
    Observable,
} from "rxjs";

import {
    distinctUntilChanged,
    first,
    map,
    pairwise,
    publishReplay,
    refCount,
    skip,
    startWith,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import { Component } from "../Component";
import { Image } from "../../graph/Image";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { LngLat } from "../../api/interfaces/LngLat";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { GraphCalculator } from "../../graph/GraphCalculator";
import { RenderPass } from "../../render/RenderPass";
import { GLRenderHash } from "../../render/interfaces/IGLRenderHash";
import { RenderCamera } from "../../render/RenderCamera";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { MarkerConfiguration } from "../interfaces/MarkerConfiguration";
import { Marker } from "./marker/Marker";
import { MarkerSet } from "./MarkerSet";
import { MarkerScene } from "./MarkerScene";
import { ComponentEventType } from "../events/ComponentEventType";
import {
    enuToGeodetic,
    geodeticToEnu,
} from "../../geo/GeoCoords";
import { ComponentMarkerEvent } from "../events/ComponentMarkerEvent";
import { ComponentEvent } from "../events/ComponentEvent";
import { ComponentName } from "../ComponentName";

/**
 * @class MarkerComponent
 *
 * @classdesc Component for showing and editing 3D marker objects.
 *
 * The `add` method is used for adding new markers or replacing
 * markers already in the set.
 *
 * If a marker already in the set has the same
 * id as one of the markers added, the old marker will be removed and
 * the added marker will take its place.
 *
 * It is not possible to update markers in the set by updating any properties
 * directly on the marker object. Markers need to be replaced by
 * re-adding them for updates to geographic position or configuration
 * to be reflected.
 *
 * Markers added to the marker component can be either interactive
 * or non-interactive. Different marker types define their behavior.
 * Markers with interaction support can be configured with options
 * to respond to dragging inside the viewer and be detected when
 * retrieving markers from pixel points with the `getMarkerIdAt` method.
 *
 * To retrive and use the marker component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ component: { marker: true }, ... });
 *
 * var markerComponent = viewer.getComponent("marker");
 * ```
 */
export class MarkerComponent extends Component<MarkerConfiguration> {
    public static componentName: ComponentName = "marker";

    private _graphCalculator: GraphCalculator;
    private _markerScene: MarkerScene;
    private _markerSet: MarkerSet;
    private _viewportCoords: ViewportCoords;

    private _relativeGroundAltitude: number;

    /** @ignore */
    constructor(
        name: string,
        container: Container,
        navigator: Navigator) {

        super(name, container, navigator);

        this._graphCalculator = new GraphCalculator();
        this._markerScene = new MarkerScene();
        this._markerSet = new MarkerSet();
        this._viewportCoords = new ViewportCoords();

        this._relativeGroundAltitude = -2;
    }

    /**
     * Add markers to the marker set or replace markers in the marker set.
     *
     * @description If a marker already in the set has the same
     * id as one of the markers added, the old marker will be removed
     * the added marker will take its place.
     *
     * Any marker inside the visible bounding bbox
     * will be initialized and placed in the viewer.
     *
     * @param {Array<Marker>} markers - Markers to add.
     *
     * @example
     * ```js
     * markerComponent.add([marker1, marker2]);
     * ```
     */
    public add(markers: Marker[]): void {
        this._markerSet.add(markers);
    }

    public fire(
        type:
            | "markerdragend"
            | "markerdragstart"
            | "markerposition",
        event: ComponentMarkerEvent)
        : void;
    /** @ignore */
    public fire(
        type: ComponentEventType,
        event: ComponentEvent)
        : void;
    public fire<T>(
        type: ComponentEventType,
        event: T)
        : void {
        super.fire(type, event);
    }

    /**
     * Returns the marker in the marker set with the specified id, or
     * undefined if the id matches no marker.
     *
     * @param {string} markerId - Id of the marker.
     *
     * @example
     * ```js
     * var marker = markerComponent.get("markerId");
     * ```
     *
     */
    public get(markerId: string): Marker {
        return this._markerSet.get(markerId);
    }

    /**
     * Returns an array of all markers.
     *
     * @example
     * ```js
     * var markers = markerComponent.getAll();
     * ```
     */
    public getAll(): Marker[] {
        return this._markerSet.getAll();
    }

    /**
     * Returns the id of the interactive marker closest to the current camera
     * position at the specified point.
     *
     * @description Notice that the pixelPoint argument requires x, y
     * coordinates from pixel space.
     *
     * With this function, you can use the coordinates provided by mouse
     * events to get information out of the marker component.
     *
     * If no interactive geometry of an interactive marker exist at the pixel
     * point, `null` will be returned.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates on the viewer element.
     * @returns {string} Id of the interactive marker closest to the camera. If no
     * interactive marker exist at the pixel point, `null` will be returned.
     *
     * @example
     * ```js
     * markerComponent.getMarkerIdAt([100, 100])
     *     .then((markerId) => { console.log(markerId); });
     * ```
     */
    public getMarkerIdAt(pixelPoint: number[]): Promise<string> {
        return new Promise<string>((resolve: (value: string) => void, reject: (reason: Error) => void): void => {
            this._container.renderService.renderCamera$.pipe(
                first(),
                map(
                    (render: RenderCamera): string => {
                        const viewport = this._viewportCoords
                            .canvasToViewport(
                                pixelPoint[0],
                                pixelPoint[1],
                                this._container.container);

                        const id: string = this._markerScene.intersectObjects(viewport, render.perspective);

                        return id;
                    }))
                .subscribe(
                    (id: string): void => {
                        resolve(id);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
        });
    }

    /**
     * Check if a marker exist in the marker set.
     *
     * @param {string} markerId - Id of the marker.
     *
     * @example
     * ```js
     * var markerExists = markerComponent.has("markerId");
     * ```
     */
    public has(markerId: string): boolean {
        return this._markerSet.has(markerId);
    }

    public off(
        type:
            | "markerdragend"
            | "markerdragstart"
            | "markerposition",
        handler: (event: ComponentMarkerEvent) => void)
        : void;
    /** @ignore */
    public off(
        type: ComponentEventType,
        handler: (event: ComponentEvent) => void)
        : void;
    public off<T>(
        type: ComponentEventType,
        handler: (event: T) => void)
        : void {
        super.off(type, handler);
    }

    /**
     * Fired when a marker drag interaction ends.
     *
     * @event markerdragend
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('markerdragend', function() {
     *   console.log("A markerdragend event has occurred.");
     * });
     * ```
     */
    public on(
        type: "markerdragend",
        handler: (event: ComponentMarkerEvent) => void)
        : void;
    /**
     * Fired when a marker drag interaction starts.
     *
     * @event markerdragstart
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('markerdragstart', function() {
     *   console.log("A markerdragstart event has occurred.");
     * });
     * ```
     */
    public on(
        type: "markerdragstart",
        handler: (event: ComponentMarkerEvent) => void)
        : void;
    /**
     * Fired when the position of a marker is changed.
     *
     * @event markerposition
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('markerposition', function() {
     *   console.log("A markerposition event has occurred.");
     * });
     * ```
     */
    public on(
        type: "markerposition",
        handler: (event: ComponentMarkerEvent) => void)
        : void;
    public on<T>(
        type: ComponentEventType,
        handler: (event: T) => void)
        : void {
        super.on(type, handler);
    }

    /**
     * Remove markers with the specified ids from the marker set.
     *
     * @param {Array<string>} markerIds - Ids for markers to remove.
     *
     * @example
     * ```js
     * markerComponent.remove(["id-1", "id-2"]);
     * ```
     */
    public remove(markerIds: string[]): void {
        this._markerSet.remove(markerIds);
    }

    /**
     * Remove all markers from the marker set.
     *
     * @example
     * ```js
     * markerComponent.removeAll();
     * ```
     */
    public removeAll(): void {
        this._markerSet.removeAll();
    }

    protected _activate(): void {
        const groundAltitude$ = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): number => {
                    return frame.state.camera.position.z + this._relativeGroundAltitude;
                }),
            distinctUntilChanged(
                (a1: number, a2: number): boolean => {
                    return Math.abs(a1 - a2) < 0.01;
                }),
            publishReplay(1),
            refCount());

        const geoInitiated$ = observableCombineLatest(
            groundAltitude$,
            this._navigator.stateService.reference$).pipe(
                first(),
                map((): void => { /* noop */ }),
                publishReplay(1),
                refCount());

        const clampedConfiguration$ = this._configuration$.pipe(
            map(
                (configuration: MarkerConfiguration): MarkerConfiguration => {
                    return { visibleBBoxSize: Math.max(1, Math.min(200, configuration.visibleBBoxSize)) };
                }));

        const currentLngLat$ = this._navigator.stateService.currentImage$.pipe(
            map((image: Image): LngLat => { return image.lngLat; }),
            publishReplay(1),
            refCount());

        const visibleBBox$ = observableCombineLatest(
            clampedConfiguration$,
            currentLngLat$).pipe(
                map(
                    ([configuration, lngLat]: [MarkerConfiguration, LngLat]): [LngLat, LngLat] => {
                        return this._graphCalculator
                            .boundingBoxCorners(lngLat, configuration.visibleBBoxSize / 2);
                    }),
                publishReplay(1),
                refCount());

        const visibleMarkers$ = observableCombineLatest(
            observableConcat(
                observableOf<MarkerSet>(this._markerSet),
                this._markerSet.changed$),
            visibleBBox$).pipe(
                map(
                    ([set, bbox]: [MarkerSet, [LngLat, LngLat]]): Marker[] => {
                        return set.search(bbox);
                    }));

        const subs = this._subscriptions;

        subs.push(geoInitiated$.pipe(
            switchMap(
                (): Observable<[Marker[], LngLatAlt, number]> => {
                    return visibleMarkers$.pipe(
                        withLatestFrom(
                            this._navigator.stateService.reference$,
                            groundAltitude$));
                }))
            .subscribe(
                (
                    [markers, reference, alt]
                        : [Marker[], LngLatAlt, number])
                    : void => {
                    const markerScene: MarkerScene = this._markerScene;
                    const sceneMarkers: { [id: string]: Marker } =
                        markerScene.markers;
                    const markersToRemove: { [id: string]: Marker } =
                        Object.assign({}, sceneMarkers);

                    for (const marker of markers) {
                        if (marker.id in sceneMarkers) {
                            delete markersToRemove[marker.id];
                        } else {
                            const point3d =
                                geodeticToEnu(
                                    marker.lngLat.lng,
                                    marker.lngLat.lat,
                                    reference.alt + alt,
                                    reference.lng,
                                    reference.lat,
                                    reference.alt);

                            markerScene.add(marker, point3d);
                        }
                    }

                    for (const id in markersToRemove) {
                        if (!markersToRemove.hasOwnProperty(id)) {
                            continue;
                        }

                        markerScene.remove(id);
                    }
                }));

        subs.push(geoInitiated$.pipe(
            switchMap(
                (): Observable<[Marker[], [LngLat, LngLat], LngLatAlt, number]> => {
                    return this._markerSet.updated$.pipe(
                        withLatestFrom(
                            visibleBBox$,
                            this._navigator.stateService.reference$,
                            groundAltitude$));
                }))
            .subscribe(
                (
                    [markers, [sw, ne], reference, alt]
                        : [Marker[], [LngLat, LngLat], LngLatAlt, number])
                    : void => {
                    const markerScene: MarkerScene = this._markerScene;

                    for (const marker of markers) {
                        const exists = markerScene.has(marker.id);
                        const visible = marker.lngLat.lat > sw.lat &&
                            marker.lngLat.lat < ne.lat &&
                            marker.lngLat.lng > sw.lng &&
                            marker.lngLat.lng < ne.lng;

                        if (visible) {
                            const point3d =
                                geodeticToEnu(
                                    marker.lngLat.lng,
                                    marker.lngLat.lat,
                                    reference.alt + alt,
                                    reference.lng,
                                    reference.lat,
                                    reference.alt);

                            markerScene.add(marker, point3d);
                        } else if (!visible && exists) {
                            markerScene.remove(marker.id);
                        }
                    }
                }));

        subs.push(this._navigator.stateService.reference$.pipe(
            skip(1),
            withLatestFrom(groundAltitude$))
            .subscribe(
                ([reference, alt]: [LngLatAlt, number]): void => {
                    const markerScene: MarkerScene = this._markerScene;

                    for (const marker of markerScene.getAll()) {
                        const point3d =
                            geodeticToEnu(
                                marker.lngLat.lng,
                                marker.lngLat.lat,
                                reference.alt + alt,
                                reference.lng,
                                reference.lat,
                                reference.alt);

                        markerScene.update(marker.id, point3d);
                    }
                }));

        subs.push(groundAltitude$.pipe(
            skip(1),
            withLatestFrom(
                this._navigator.stateService.reference$,
                currentLngLat$))
            .subscribe(
                (
                    [alt, reference, lngLat]
                        : [number, LngLatAlt, LngLat])
                    : void => {
                    const markerScene = this._markerScene;

                    const position =
                        geodeticToEnu(
                            lngLat.lng,
                            lngLat.lat,
                            reference.alt + alt,
                            reference.lng,
                            reference.lat,
                            reference.alt);

                    for (const marker of markerScene.getAll()) {
                        const point3d =
                            geodeticToEnu(
                                marker.lngLat.lng,
                                marker.lngLat.lat,
                                reference.alt + alt,
                                reference.lng,
                                reference.lat,
                                reference.alt);

                        const distanceX = point3d[0] - position[0];
                        const distanceY = point3d[1] - position[1];

                        const groundDistance = Math
                            .sqrt(distanceX * distanceX + distanceY * distanceY);
                        if (groundDistance > 50) {
                            continue;
                        }

                        markerScene.lerpAltitude(marker.id, alt, Math.min(1, Math.max(0, 1.2 - 1.2 * groundDistance / 50)));
                    }
                }));

        subs.push(this._navigator.stateService.currentState$
            .pipe(
                map(
                    (frame: AnimationFrame): GLRenderHash => {
                        const scene = this._markerScene;

                        return {
                            name: this._name,
                            renderer: {
                                frameId: frame.id,
                                needsRender: scene.needsRender,
                                render: scene.render.bind(scene),
                                pass: RenderPass.Opaque,
                            },
                        };
                    }))
            .subscribe(this._container.glRenderer.render$));

        const hoveredMarkerId$: Observable<string> =
            observableCombineLatest(
                this._container.renderService.renderCamera$,
                this._container.mouseService.mouseMove$)
                .pipe(
                    map(
                        ([render, event]: [RenderCamera, MouseEvent]): string => {
                            const element = this._container.container;
                            const [canvasX, canvasY] = this._viewportCoords.canvasPosition(event, element);
                            const viewport = this._viewportCoords
                                .canvasToViewport(
                                    canvasX,
                                    canvasY,
                                    element);

                            const markerId: string = this._markerScene.intersectObjects(viewport, render.perspective);

                            return markerId;
                        }),
                    publishReplay(1),
                    refCount());

        const draggingStarted$: Observable<boolean> =
            this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDragStart$).pipe(
                    map(
                        (): boolean => {
                            return true;
                        }));

        const draggingStopped$: Observable<boolean> =
            this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDragEnd$).pipe(
                    map(
                        (): boolean => {
                            return false;
                        }));

        const filteredDragging$: Observable<boolean> =
            observableMerge(
                draggingStarted$,
                draggingStopped$)
                .pipe(
                    startWith(false));

        subs.push(observableMerge(
            draggingStarted$.pipe(
                withLatestFrom(hoveredMarkerId$)),
            observableCombineLatest(
                draggingStopped$,
                observableOf<string>(null))).pipe(
                    startWith<[boolean, string]>([false, null]),
                    pairwise())
            .subscribe(
                ([previous, current]: [boolean, string][]): void => {
                    const dragging = current[0];
                    const type: ComponentEventType =
                        dragging ?
                            "markerdragstart" :
                            "markerdragend";
                    const id = dragging ? current[1] : previous[1];
                    const marker = this._markerScene.get(id);
                    const event: ComponentMarkerEvent = {
                        marker,
                        target: this,
                        type,
                    };
                    this.fire(type, event);
                }));

        const mouseDown$: Observable<boolean> = observableMerge(
            this._container.mouseService.mouseDown$.pipe(
                map((): boolean => { return true; })),
            this._container.mouseService.documentMouseUp$.pipe(
                map((): boolean => { return false; }))).pipe(
                    startWith(false));

        subs.push(
            observableCombineLatest(
                this._container.mouseService.active$,
                hoveredMarkerId$.pipe(distinctUntilChanged()),
                mouseDown$,
                filteredDragging$)
                .pipe(
                    map(
                        (
                            [active, markerId, mouseDown, filteredDragging]
                                : [boolean, string, boolean, boolean])
                            : boolean => {
                            return (!active && markerId != null && mouseDown) ||
                                filteredDragging;
                        }),
                    distinctUntilChanged())
                .subscribe(
                    (claim: boolean): void => {
                        if (claim) {
                            this._container.mouseService.claimMouse(this._name, 1);
                            this._container.mouseService.claimWheel(this._name, 1);
                        } else {
                            this._container.mouseService.unclaimMouse(this._name);
                            this._container.mouseService.unclaimWheel(this._name);
                        }
                    }));

        const offset$: Observable<[Marker, number[], RenderCamera]> = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDragStart$).pipe(
                withLatestFrom(
                    hoveredMarkerId$,
                    this._container.renderService.renderCamera$),
                map(
                    (
                        [e, id, r]:
                            [MouseEvent, string, RenderCamera])
                        : [Marker, number[], RenderCamera] => {
                        const marker: Marker = this._markerScene.get(id);
                        const element = this._container.container;

                        const [groundCanvasX, groundCanvasY]: number[] =
                            this._viewportCoords
                                .projectToCanvas(
                                    marker.geometry.position
                                        .toArray(),
                                    element,
                                    r.perspective);

                        const [canvasX, canvasY] = this._viewportCoords
                            .canvasPosition(e, element);

                        const offset = [canvasX - groundCanvasX, canvasY - groundCanvasY];

                        return [marker, offset, r];
                    }),
                publishReplay(1),
                refCount());

        subs.push(this._container.mouseService
            .filtered$(
                this._name,
                this._container.mouseService.mouseDrag$)
            .pipe(
                withLatestFrom(
                    offset$,
                    this._navigator.stateService.reference$,
                    clampedConfiguration$))
            .subscribe(
                ([event, [marker, offset, render], reference, configuration]:
                    [MouseEvent, [Marker, number[], RenderCamera], LngLatAlt, MarkerConfiguration]): void => {
                    if (!this._markerScene.has(marker.id)) {
                        return;
                    }

                    const element = this._container.container;
                    const [canvasX, canvasY] = this._viewportCoords

                        .canvasPosition(event, element);

                    const groundX = canvasX - offset[0];
                    const groundY = canvasY - offset[1];

                    const [viewportX, viewportY] = this._viewportCoords
                        .canvasToViewport(
                            groundX,
                            groundY,
                            element);

                    const direction =
                        new THREE.Vector3(viewportX, viewportY, 1)
                            .unproject(render.perspective)
                            .sub(render.perspective.position)
                            .normalize();

                    const distance = Math.min(
                        this._relativeGroundAltitude / direction.z,
                        configuration.visibleBBoxSize / 2 - 0.1);

                    if (distance < 0) {
                        return;
                    }

                    const intersection = direction
                        .clone()
                        .multiplyScalar(distance)
                        .add(render.perspective.position);

                    intersection.z =
                        render.perspective.position.z
                        + this._relativeGroundAltitude;

                    const [lng, lat] =
                        enuToGeodetic(
                            intersection.x,
                            intersection.y,
                            intersection.z,
                            reference.lng,
                            reference.lat,
                            reference.alt);

                    this._markerScene
                        .update(
                            marker.id,
                            intersection.toArray(),
                            { lat, lng });

                    this._markerSet.update(marker);

                    const type: ComponentEventType = "markerposition";
                    const markerEvent: ComponentMarkerEvent = {
                        marker,
                        target: this,
                        type,
                    };
                    this.fire(type, markerEvent);
                }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
        this._markerScene.clear();
    }

    protected _getDefaultConfiguration(): MarkerConfiguration {
        return { visibleBBoxSize: 100 };
    }
}
