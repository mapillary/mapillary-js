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

interface IUpdateArgs {
    frame: IFrame;
    markers: MarkerIndex;
}

export class MarkerComponent extends Component<IMarkerConfiguration> {
    public static componentName: string = "marker";

    private _graphCalculator: GraphCalculator;
    private _markerSet: MarkerSet;

    private _renderedMarkers: { [id: string]: THREE.Object3D };
    private _renderSubscription: Subscription;

    private _scene: THREE.Scene;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._graphCalculator = new GraphCalculator();
        this._markerSet = new MarkerSet();
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

        this._renderSubscription = Observable
            .combineLatest(
                [
                    this._navigator.stateService.currentState$,
                    this._markerSet.markerIndex$,
                ],
                (frame: IFrame, markers: MarkerIndex): IUpdateArgs => {
                    return { frame: frame, markers: markers };
                })
            .distinctUntilChanged(
                undefined,
                (args: IUpdateArgs): number => {
                    return args.frame.id;
                })
            .map(
                (args: IUpdateArgs): IGLRenderHash => {
                    return this._renderHash(args);
                })
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        // release memory
        this._disposeScene();
        this._renderSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IMarkerConfiguration {
        return {};
    }

    private _renderHash(args: IUpdateArgs): IGLRenderHash {
        // determine if render is needed while updating scene
        // specific properies.
        let needsRender: boolean = this._updateScene(args);

        // return render hash with render function and
        // render in foreground.
        return {
            name: this._name,
            render: {
                frameId: args.frame.id,
                needsRender: needsRender,
                render: this._render.bind(this),
                stage: GLRenderStage.Foreground,
            },
        };
    }

    private _updateScene(args: IUpdateArgs): boolean {
        if (!args.frame ||
            !args.markers ||
            !args.frame.state.currentNode) {
            return false;
        }

        let needRender: boolean = false;
        let oldObjects: { [id: string]: THREE.Object3D } = this._renderedMarkers;
        let node: Node = args.frame.state.currentNode;
        this._renderedMarkers = {};

        let [sw, ne]: ILatLon[] =
            this._graphCalculator.boundingBoxCorners(node.latLon, 50);

        let markers: Marker[] =
            args.markers
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
            if (marker.id in oldObjects) {
                this._renderedMarkers[marker.id] = oldObjects[marker.id];
                delete oldObjects[marker.id];
            } else {
                let reference: ILatLonAlt = args.frame.state.reference;
                let p: number[] = (new GeoCoords).geodeticToEnu(
                    marker.latLonAlt.lat, marker.latLonAlt.lon, marker.latLonAlt.alt,
                    reference.lat, reference.lon, reference.alt);

                let o: THREE.Object3D = marker.createGeometry();
                o.position.set(p[0], p[1], p[2]);
                this._scene.add(o);
                this._renderedMarkers[marker.id] = o;
                needRender = true;
            }
        }

        for (let i in oldObjects) {
            if (oldObjects.hasOwnProperty(i)) {
                this._disposeObject(oldObjects[i]);
                needRender = true;
            }
        }

        return needRender;
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
