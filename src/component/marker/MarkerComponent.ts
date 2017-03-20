/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";

import {ILatLon} from "../../API";
import {
    IMarkerConfiguration,
    IMarkerEvent,
    Marker,
    MarkerScene,
    MarkerSet,
    ComponentService,
    Component,
} from "../../Component";
import {IFrame} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";
import {
    IGLRenderHash,
    GLRenderStage,
    RenderCamera,
} from "../../Render";
import {
    GraphCalculator,
    Node,
} from "../../Graph";
import {
    GeoCoords,
    ILatLonAlt,
    ViewportCoords,
} from "../../Geo";

export class MarkerComponent extends Component<IMarkerConfiguration> {
    public static componentName: string = "marker";

    /**
     * Fired when the position of a marker is changed.
     * @event
     * @type {IMarkerEvent} markerEvent - Event with the marker.
     */
    public static changed: string = "changed";

    private _geoCoords: GeoCoords;
    private _graphCalculator: GraphCalculator;
    private _markerScene: MarkerScene;
    private _markerSet: MarkerSet;
    private _viewportCoords: ViewportCoords;

    private _markersUpdatedSubscription: Subscription;
    private _referenceSubscription: Subscription;
    private _renderSubscription: Subscription;
    private _setChangedSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._geoCoords = new GeoCoords();
        this._graphCalculator = new GraphCalculator();
        this._markerScene = new MarkerScene();
        this._markerSet = new MarkerSet();
        this._viewportCoords = new ViewportCoords();
    }

    public add(markers: Marker[]): void {
        this._markerSet.add(markers);
    }

    public get(markerId: string): Marker {
        return this._markerSet.get(markerId);
    }

    public getAll(): Marker[] {
        return this._markerSet.getAll();
    }

    public remove(markerIds: string[]): void {
        this._markerSet.remove(markerIds);
    }

    public removeAll(): void {
        this._markerSet.removeAll();
    }

    protected _activate(): void {
        const groundAltitude$: Observable<number> = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): number => {
                    return frame.state.camera.position.z - 2;
                })
            .distinctUntilChanged(
                (a1: number, a2: number): boolean => {
                    return Math.abs(a1 - a2) < 0.01;
                })
            .publishReplay(1)
            .refCount();

        const geoInitiated$: Observable<void> = Observable
            .combineLatest(
                groundAltitude$,
                this._navigator.stateService.reference$)
            .first()
            .map((): void => { /* noop */ })
            .publishReplay(1)
            .refCount();

        const clampedConfiguration$: Observable<IMarkerConfiguration> = this._configuration$
            .map(
                (configuration: IMarkerConfiguration): IMarkerConfiguration => {
                    return { visibleBBoxSize: Math.max(1, Math.min(200, configuration.visibleBBoxSize)) };
                });

        const currentlatLon$: Observable<ILatLon> = this._navigator.stateService.currentNode$
            .map((node: Node): ILatLon => { return node.latLon; })
            .publishReplay(1)
            .refCount();

        const visibleBBox$: Observable<[ILatLon, ILatLon]> = Observable
            .combineLatest(
                clampedConfiguration$,
                currentlatLon$)
            .map(
                ([configuration, latLon]: [IMarkerConfiguration, ILatLon]): [ILatLon, ILatLon] => {
                    return this._graphCalculator
                        .boundingBoxCorners(latLon, configuration.visibleBBoxSize / 2);
                })
            .publishReplay(1)
            .refCount();

        const visibleMarkers$: Observable<Marker[]> = Observable
            .combineLatest(
                Observable
                    .of<MarkerSet>(this._markerSet)
                    .concat(this._markerSet.changed$),
                visibleBBox$)
            .map(
                ([set, bbox]: [MarkerSet, [ILatLon, ILatLon]]): Marker[] => {
                    return set.search(bbox);
                });

        this._setChangedSubscription = geoInitiated$
            .switchMap(
                (): Observable<[Marker[], ILatLonAlt, number]> => {
                    return visibleMarkers$
                        .withLatestFrom(
                            this._navigator.stateService.reference$,
                            groundAltitude$);
                })
            .subscribe(
                ([markers, reference, alt]: [Marker[], ILatLonAlt, number]): void => {
                    const geoCoords: GeoCoords = this._geoCoords;
                    const markerScene: MarkerScene = this._markerScene;
                    const sceneMarkers: { [id: string]: Marker } = markerScene.markers;
                    const markersToRemove: { [id: string]: Marker } = Object.assign({}, sceneMarkers);

                    for (const marker of markers) {
                         if (marker.id in sceneMarkers) {
                            delete markersToRemove[marker.id];
                        } else {
                            const point3d: number[] = geoCoords
                                .geodeticToEnu(
                                    marker.latLon.lat,
                                    marker.latLon.lon,
                                    reference.alt + alt,
                                    reference.lat,
                                    reference.lon,
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
                });

        this._markersUpdatedSubscription = geoInitiated$
            .switchMap(
                (): Observable<[Marker[], [ILatLon, ILatLon], ILatLonAlt, number]> => {
                    return this._markerSet.updated$
                        .withLatestFrom(
                            visibleBBox$,
                            this._navigator.stateService.reference$,
                            groundAltitude$);
                })
            .subscribe(
                ([markers, [sw, ne], reference, alt]: [Marker[], [ILatLon, ILatLon], ILatLonAlt, number]): void => {
                    const geoCoords: GeoCoords = this._geoCoords;
                    const markerScene: MarkerScene = this._markerScene;

                    for (const marker of markers) {
                        const exists: boolean = markerScene.has(marker.id);
                        const visible: boolean = marker.latLon.lat > sw.lat &&
                            marker.latLon.lat < ne.lat &&
                            marker.latLon.lon > sw.lon &&
                            marker.latLon.lon < ne.lon;

                        if (visible) {
                            const point3d: number[] = geoCoords
                                .geodeticToEnu(
                                    marker.latLon.lat,
                                    marker.latLon.lon,
                                    reference.alt + alt,
                                    reference.lat,
                                    reference.lon,
                                    reference.alt);

                            if (exists) {
                                markerScene.update(marker.id, point3d, marker.latLon);
                            } else {
                                markerScene.add(marker, point3d);
                            }
                        } else if (!visible && exists) {
                            markerScene.remove(marker.id);
                        }
                    }
                });

        this._referenceSubscription = this._navigator.stateService.reference$
            .skip(1)
            .withLatestFrom(groundAltitude$)
            .subscribe(
                ([reference, alt]: [ILatLonAlt, number]): void => {
                    const geoCoords: GeoCoords = this._geoCoords;
                    const markerScene: MarkerScene = this._markerScene;

                    for (const marker of markerScene.getAll()) {
                        const point3d: number[] = geoCoords
                                .geodeticToEnu(
                                    marker.latLon.lat,
                                    marker.latLon.lon,
                                    reference.alt + alt,
                                    reference.lat,
                                    reference.lon,
                                    reference.alt);

                        markerScene.update(marker.id, point3d);
                    }
                });

        groundAltitude$
            .skip(1)
            .withLatestFrom(
                this._navigator.stateService.reference$,
                currentlatLon$)
            .subscribe(
                ([alt, reference, latLon]: [number, ILatLonAlt, ILatLon]): void => {
                    const geoCoords: GeoCoords = this._geoCoords;
                    const markerScene: MarkerScene = this._markerScene;

                    const position: number[] = geoCoords
                        .geodeticToEnu(
                            latLon.lat,
                            latLon.lon,
                            reference.alt + alt,
                            reference.lat,
                            reference.lon,
                            reference.alt);

                    for (const marker of markerScene.getAll()) {
                        const point3d: number[] = geoCoords
                                .geodeticToEnu(
                                    marker.latLon.lat,
                                    marker.latLon.lon,
                                    reference.alt + alt,
                                    reference.lat,
                                    reference.lon,
                                    reference.alt);

                        const distanceX: number = point3d[0] - position[0];
                        const distanceY: number = point3d[1] - position[1];

                        const groundDistance: number = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                        if (groundDistance > 50) {
                            continue;
                        }

                        markerScene.lerpAltitude(marker.id, alt, Math.min(1, Math.max(0, 1.2 - 1.2 * groundDistance / 50)));
                    }
                });

        this._renderSubscription = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): IGLRenderHash => {
                    const scene: MarkerScene = this._markerScene;

                    return {
                        name: this._name,
                        render: {
                            frameId: frame.id,
                            needsRender: scene.needsRender,
                            render: scene.render.bind(scene),
                            stage: GLRenderStage.Foreground,
                        },
                    };
                })
            .subscribe(this._container.glRenderer.render$);

        const hoveredMarkerId$: Observable<string> = Observable
            .combineLatest(
                this._container.renderService.renderCamera$,
                this._container.mouseService.mouseMove$)
            .map(
                ([render, event]: [RenderCamera, MouseEvent]): string => {
                    const viewport: number[] = this._viewportCoords.canvasToViewport(
                        event.clientX,
                        event.clientY,
                        this._container.element.offsetWidth,
                        this._container.element.offsetHeight);

                    const markerId: string = this._markerScene.intersectObjects(viewport, render.perspective);

                    return markerId;
                })
            .publishReplay(1)
            .refCount();

        const draggingStarted$: Observable<boolean> =
             this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDragStart$)
                .map(
                    (event: MouseEvent): boolean => {
                        return true;
                    });

        const draggingStopped$: Observable<boolean> =
             this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDragEnd$)
                .map(
                    (event: MouseEvent): boolean => {
                        return false;
                    });

        const dragging$: Observable<boolean> = Observable
            .merge(
                draggingStarted$,
                draggingStopped$)
            .startWith(false);

        Observable
            .combineLatest(
                this._container.mouseService.active$,
                hoveredMarkerId$,
                dragging$)
            .map(
                ([active, markerId, dragging]: [boolean, string, boolean]): boolean => {
                    return (!active && markerId != null) || dragging;
                })
            .distinctUntilChanged()
            .subscribe(
                (hovered: boolean): void => {
                    if (hovered) {
                        this._container.mouseService.claimMouse(this._name, 1);
                    } else {
                        this._container.mouseService.unclaimMouse(this._name);
                    }
                });

        const offset$: Observable<[Marker, number[], RenderCamera]> = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDragStart$)
            .withLatestFrom(
                hoveredMarkerId$,
                this._container.renderService.renderCamera$)
            .map(
                ([e, id, r]: [MouseEvent, string, RenderCamera]): [Marker, number[], RenderCamera] => {
                    const marker: Marker = this._markerScene.get(id);
                    const [groundCanvasX, groundCanvasY]: number[] =
                        this._viewportCoords.projectToCanvas(
                            marker.geometry.position.toArray(),
                            this._container.element.offsetWidth,
                            this._container.element.offsetHeight,
                            r.perspective);

                    const offset: number[] = [e.clientX - groundCanvasX, e.clientY - groundCanvasY];

                    return [marker, offset, r];
                })
            .publishReplay(1)
            .refCount();

        this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDrag$)
            .withLatestFrom(
                offset$,
                this._navigator.stateService.reference$)
            .subscribe(
                ([event, [marker, offset, render], reference]: [MouseEvent, [Marker, number[], RenderCamera], ILatLonAlt]): void => {
                    const groundX: number = event.clientX - offset[0];
                    const groundY: number = event.clientY - offset[1];

                    const [viewportX, viewportY]: number[] = this._viewportCoords.canvasToViewport(
                        groundX,
                        groundY,
                        this._container.element.offsetWidth,
                        this._container.element.offsetHeight);

                    const direction: THREE.Vector3 = new THREE.Vector3(viewportX, viewportY, 1)
                        .unproject(render.perspective)
                        .sub(render.perspective.position)
                        .normalize();

                    let distance: number = -2 / direction.z;
                    if (distance < 0) {
                        return;
                    }

                    const intersection: THREE.Vector3 = direction
                        .clone()
                        .multiplyScalar(distance)
                        .add(render.perspective.position);

                    const [lat, lon]: number[] = this._geoCoords
                        .enuToGeodetic(
                            intersection.x,
                            intersection.y,
                            intersection.z,
                            reference.lat,
                            reference.lon,
                            reference.alt);

                    const markerEvent: IMarkerEvent = { marker: marker };

                    this._markerScene.update(marker.id, intersection.toArray(), { lat: lat, lon: lon });
                    this.fire(MarkerComponent.changed, markerEvent);
                });
    }

    protected _deactivate(): void {
        this._markersUpdatedSubscription.unsubscribe();
        this._referenceSubscription.unsubscribe();
        this._renderSubscription.unsubscribe();
        this._setChangedSubscription.unsubscribe();

        this._markerScene.clear();
    }

    protected _getDefaultConfiguration(): IMarkerConfiguration {
        return { visibleBBoxSize: 100 };
    }
}

ComponentService.register(MarkerComponent);
export default MarkerComponent;
