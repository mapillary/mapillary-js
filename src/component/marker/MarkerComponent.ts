/// <reference path="../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";

import {ILatLon} from "../../API";
import {
    IMarkerConfiguration,
    IMarkerIndexItem,
    Marker,
    MarkerIndex,
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

    private _renderSubscription: Subscription;
    private _sceneUpdateSubscription: Subscription;

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

        let latLon$: Observable<ILatLon> = this._navigator.stateService.currentNode$
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
                this._markerSet.markerIndex$)
            .map(
                ([[sw, ne], index]: [[ILatLon, ILatLon], MarkerIndex]): Marker[] => {
                    return index
                        .search({ maxX: ne.lon, maxY: ne.lat, minX: sw.lon, minY: sw.lat })
                        .map(
                            (indexItem: IMarkerIndexItem): Marker => {
                                return indexItem.marker;
                            });
                });
    }

    public add(markers: Marker[]): void {
        this._markerSet.add(markers);
    }

    public getAll$(): Observable<Marker[]> {
        return this._markerSet.markerIndex$
            .first()
            .map(
                (index: MarkerIndex): Marker[] => {
                    return index
                        .all()
                        .map(
                            (indexItem: IMarkerIndexItem): Marker => {
                                return indexItem.marker;
                            });
                });
    }

    public remove(ids: string[]): void {
        this._markerSet.remove(ids);
    }

    protected _activate(): void {
        this._sceneUpdateSubscription = Observable
            .combineLatest(
                this._visibleMarkers$,
                this._navigator.stateService.reference$)
            .subscribe(
                ([markers, reference]: [Marker[], ILatLonAlt]): void => {
                    const markerScene: MarkerScene = this._markerScene;
                    const sceneMarkers: { [id: string]: Marker } = markerScene.markers;
                    const markersToRemove: { [id: string]: Marker } = Object.assign({}, sceneMarkers);

                    for (let marker of markers) {
                         if (marker.id in sceneMarkers) {
                            delete markersToRemove[marker.id];
                        } else {
                            const point3d: number[] = this._geoCoords
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

                    for (let id in markersToRemove) {
                        if (!markersToRemove.hasOwnProperty(id)) {
                            continue;
                        }

                        markerScene.remove(id);
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
        this._renderSubscription.unsubscribe();
        this._sceneUpdateSubscription.unsubscribe();

        this._markerScene.clear();
    }

    protected _getDefaultConfiguration(): IMarkerConfiguration {
        return { visibleBBoxSize: 100 };
    }
}

ComponentService.register(MarkerComponent);
export default MarkerComponent;
