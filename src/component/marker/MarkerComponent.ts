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
    IMarkerIndexItem,
    Marker,
    MarkerIndex,
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
    private _markerSet: MarkerSet;

    private _needsRender: boolean;

    private _renderedMarkers: { [id: string]: Marker };

    private _renderSubscription: Subscription;

    private _scene: THREE.Scene;
    private _updateSceneSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._geoCoords = new GeoCoords();
        this._graphCalculator = new GraphCalculator();
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
        this._scene = new THREE.Scene();
        this._renderedMarkers = {};

        this._updateSceneSubscription = Observable
            .combineLatest(
                this._visibleMarkers$,
                this._navigator.stateService.reference$)
            .subscribe(
                ([markers, reference]:
                    [Marker[], ILatLonAlt]): void => {
                    this._updateScene(markers, reference);
                });

        this._renderSubscription = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): IGLRenderHash => {
                    return {
                        name: this._name,
                        render: {
                            frameId: frame.id,
                            needsRender: this._needsRender,
                            render: this._render.bind(this),
                            stage: GLRenderStage.Foreground,
                        },
                    };
                })
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
        this._updateSceneSubscription.unsubscribe();

        this._disposeScene();
    }

    protected _getDefaultConfiguration(): IMarkerConfiguration {
        return { visibleBBoxSize: 100 };
    }

    private _updateScene(visibleMarkers: Marker[], reference: ILatLonAlt): void {
        let markersToRemove: { [id: string]: Marker } = Object.assign({}, this._renderedMarkers);

        for (let marker of visibleMarkers) {
            if (marker.id in this._renderedMarkers) {
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

                marker.createGeometry(point3d);

                this._scene.add(marker.geometry);
                this._renderedMarkers[marker.id] = marker;

                this._needsRender = true;
            }
        }

        for (let key in markersToRemove) {
            if (!markersToRemove.hasOwnProperty(key)) {
                continue;
            }

            this._scene.remove(markersToRemove[key].geometry);
            markersToRemove[key].disposeGeometry();
            delete this._renderedMarkers[key];

            this._needsRender = true;
        }
    }

    private _render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);
    }

    private _disposeScene(): void {
        for (let key in this._renderedMarkers) {
            if (!this._renderedMarkers.hasOwnProperty(key)) {
                continue;
            }

            this._scene.remove(this._renderedMarkers[key].geometry);
            this._renderedMarkers[key].disposeGeometry();
        }

        this._renderedMarkers = {};
    }
}

ComponentService.register(MarkerComponent);
export default MarkerComponent;
