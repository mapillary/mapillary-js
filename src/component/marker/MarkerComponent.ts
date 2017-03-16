/// <reference path="../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";

import {ILatLon} from "../../API";
import {
    IMarkerConfiguration,
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
} from "../../Render";
import {
    GraphCalculator,
    Node,
} from "../../Graph";
import {
    GeoCoords,
    ILatLonAlt,
} from "../../Geo";

export class MarkerComponent extends Component<IMarkerConfiguration> {
    public static componentName: string = "marker";

    private _geoCoords: GeoCoords;
    private _graphCalculator: GraphCalculator;
    private _markerScene: MarkerScene;
    private _markerSet: MarkerSet;

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
        const altitude$: Observable<number> = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): number => {
                    return frame.state.camera.position.z - 2;
                })
            .distinctUntilChanged(
                (a1: number, a2: number): boolean => {
                    return Math.abs(a1 - a2) < 0.2;
                })
            .publishReplay(1)
            .refCount();

        const geoInitiated$: Observable<void> = Observable
            .combineLatest(
                altitude$,
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

        const visibleBBox$: Observable<[ILatLon, ILatLon]> = Observable
            .combineLatest(
                clampedConfiguration$,
                this._navigator.stateService.currentNode$)
            .map(
                ([configuration, node]: [IMarkerConfiguration, Node]): [ILatLon, ILatLon] => {
                    return this._graphCalculator
                        .boundingBoxCorners(node.latLon, configuration.visibleBBoxSize / 2);
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
                    console.log("test");
                    return visibleMarkers$
                        .withLatestFrom(
                            this._navigator.stateService.reference$.do(console.log),
                            altitude$.do(console.log));
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
                            altitude$);
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
                                markerScene.update(marker.id, point3d);
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
            .withLatestFrom(altitude$)
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
