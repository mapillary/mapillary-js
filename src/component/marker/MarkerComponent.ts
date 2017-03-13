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
    IMarkerOptions,
    IMarkerIndexItem,
    Marker,
    MarkerIndex,
    MarkerSet,
    ComponentService,
    Component,
    SimpleMarker,
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

    private _clampedConfiguration: Observable<IMarkerConfiguration>;

    private _geoCoords: GeoCoords;
    private _graphCalculator: GraphCalculator;
    private _markerSet: MarkerSet;

    private _needsRender: boolean;

    private _renderedMarkers: { [id: string]: THREE.Object3D };
    private _renderSubscription: Subscription;

    private _scene: THREE.Scene;
    private _updateSceneSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._geoCoords = new GeoCoords();
        this._graphCalculator = new GraphCalculator();
        this._markerSet = new MarkerSet();

        this._clampedConfiguration = this._configuration$
            .map(
                (configuration: IMarkerConfiguration): IMarkerConfiguration => {
                    return { visibleBBoxSize: Math.max(1, Math.min(200, configuration.visibleBBoxSize)) };
                });
    }

    public get markers$(): Observable<MarkerIndex> {
        return this._markerSet.markerIndex$;
    }

    public addMarker(marker: Marker): void {
        this._markerSet.add(marker);
    }

    public createMarker(latLonAlt: ILatLonAlt, markerOptions: IMarkerOptions): Marker {
        if (markerOptions.type === "marker") {
            return new SimpleMarker(latLonAlt, markerOptions);
        }

        return null;
    }

    public removeMarker(id: string): void {
        this._markerSet.remove(id);
    }

    protected _activate(): void {
        this._scene = new THREE.Scene();
        this._renderedMarkers = {};

        this._updateSceneSubscription = Observable
            .combineLatest(
                this._markerSet.markerIndex$,
                this._navigator.stateService.currentNode$,
                this._clampedConfiguration,
                this._navigator.stateService.reference$)
            .subscribe(
                ([markerIndex, node, configuration, reference]:
                    [MarkerIndex, Node, IMarkerConfiguration, ILatLonAlt]): void => {
                    this._updateScene(markerIndex, node, configuration, reference);
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

    private _updateScene(
        markerIndex: MarkerIndex,
        node: Node,
        configuration: IMarkerConfiguration,
        reference: ILatLonAlt): void {
        let markersToRemove: { [id: string]: THREE.Object3D } = Object.assign({}, this._renderedMarkers);

        const [sw, ne]: ILatLon[] =
            this._graphCalculator.boundingBoxCorners(node.latLon, configuration.visibleBBoxSize / 2);

        const markers: Marker[] =
            markerIndex
                .search({ maxX: ne.lon, maxY: ne.lat, minX: sw.lon, minY: sw.lat })
                .map(
                    (item: IMarkerIndexItem) => {
                        return item.marker;
                    })
                .filter(
                    (marker: Marker) => {
                        return marker.visibleInKeys.length === 0 ||
                            marker.visibleInKeys.indexOf(node.key) > -1;
                    });

        for (let marker of markers) {
            if (marker.id in this._renderedMarkers) {
                delete markersToRemove[marker.id];
            } else {
                const point3d: number[] = this._geoCoords
                    .geodeticToEnu(
                        marker.latLonAlt.lat,
                        marker.latLonAlt.lon,
                        marker.latLonAlt.alt,
                        reference.lat,
                        reference.lon,
                        reference.alt);

                const markerObject: THREE.Object3D = marker.createGeometry();
                markerObject.position.set(point3d[0], point3d[1], point3d[2]);

                this._scene.add(markerObject);
                this._renderedMarkers[marker.id] = markerObject;

                this._needsRender = true;
            }
        }

        for (let key in markersToRemove) {
            if (!markersToRemove.hasOwnProperty(key)) {
                continue;
            }

            this._disposeObject(markersToRemove[key]);
            delete this._renderedMarkers[key];

            this._needsRender = true;
        }
    }

    private _render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);
    }

    private _disposeObject(object: THREE.Object3D): void {
        this._scene.remove(object);
        for (let i: number = 0; i < object.children.length; ++i) {
            let c: THREE.Mesh = <THREE.Mesh> object.children[i];
            c.geometry.dispose();
            c.material.dispose();
        }
    }

    private _disposeScene(): void {
        for (let i in this._renderedMarkers) {
            if (this._renderedMarkers.hasOwnProperty(i)) {
                this._disposeObject(this._renderedMarkers[i]);
            }
        }
        this._renderedMarkers = {};
    }
}

ComponentService.register(MarkerComponent);
export default MarkerComponent;
