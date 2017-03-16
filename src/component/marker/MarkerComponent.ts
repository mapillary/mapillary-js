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

    private _clampedConfiguration$: Observable<IMarkerConfiguration>;
    private _visibleBBox$: Observable<[ILatLon, ILatLon]>;
    private _visibleMarkers$: Observable<Marker[]>;

    private _geoCoords: GeoCoords;
    private _graphCalculator: GraphCalculator;
    private _markerScene: MarkerScene;
    private _markerSet: MarkerSet;

    private _markersUpdatedSubscription: Subscription;
    private _renderSubscription: Subscription;
    private _setChangedSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._geoCoords = new GeoCoords();
        this._graphCalculator = new GraphCalculator();
        this._markerScene = new MarkerScene();
        this._markerSet = new MarkerSet();

        this._clampedConfiguration$ = this._configuration$
            .map(
                (configuration: IMarkerConfiguration): IMarkerConfiguration => {
                    return { visibleBBoxSize: Math.max(1, Math.min(200, configuration.visibleBBoxSize)) };
                });

        const latLon$: Observable<ILatLon> = this._navigator.stateService.currentNode$
            .map(
                (node: Node): ILatLon => {
                    return node.latLon;
                });

        this._visibleBBox$ = Observable
            .combineLatest(
                this._clampedConfiguration$,
                latLon$)
            .map(
                ([configuration, latLon]: [IMarkerConfiguration, ILatLon]): [ILatLon, ILatLon] => {
                    return this._graphCalculator
                        .boundingBoxCorners(latLon, configuration.visibleBBoxSize / 2);
                })
            .share();

        this._visibleMarkers$ = Observable
            .combineLatest(
                this._visibleBBox$,
                this._markerSet.changed$)
            .map(
                ([bbox, set]: [[ILatLon, ILatLon], MarkerSet]): Marker[] => {
                    return set.search(bbox);
                });
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

    protected _activate(): void {
        this._setChangedSubscription = Observable
            .combineLatest(
                this._visibleMarkers$,
                this._navigator.stateService.reference$)
            .subscribe(
                ([markers, reference]: [Marker[], ILatLonAlt]): void => {
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
                                    0,
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

        this._markersUpdatedSubscription = this._markerSet.updated$
            .withLatestFrom(
                this._visibleBBox$,
                this._navigator.stateService.reference$)
            .subscribe(
                ([markers, [sw, ne], reference]: [Marker[], [ILatLon, ILatLon], ILatLonAlt]): void => {
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
                                    0,
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
