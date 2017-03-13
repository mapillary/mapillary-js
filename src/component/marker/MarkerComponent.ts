/// <reference path="../../../typings/index.d.ts" />

import * as _ from "underscore";
import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/switchMap";

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
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
import {Node} from "../../Graph";
import {GeoCoords, ILatLonAlt} from "../../Geo";

interface IUpdateArgs {
    frame: IFrame;
    markers: MarkerIndex;
}

export class MarkerComponent extends Component<IMarkerConfiguration> {
    public static componentName: string = "marker";

    private _disposable: Subscription;
    private _markerSet: MarkerSet;

    private _scene: THREE.Scene;
    private _markerObjects: {[id: string]: THREE.Object3D};

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._scene = new THREE.Scene();
        this._markerSet = new MarkerSet();
        this._markerObjects = {};

        this._disposable = Observable
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
        this._disposable.unsubscribe();
    }

    protected _getDefaultConfiguration(): IMarkerConfiguration {
        return {};
    }

    public createMarker(latLonAlt: ILatLonAlt, markerOptions: IMarkerOptions): Marker {
        if (markerOptions.type === "marker") {
            return new SimpleMarker(latLonAlt, markerOptions);
        }

        return null;
    }

    public addMarker(marker: Marker): void {
        this._markerSet.add(marker);
    }

    public get markers$(): Observable<MarkerIndex> {
        return this._markerSet.markerIndex$;
    }

    public removeMarker(id: string): void {
        this._markerSet.remove(id);
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
        let oldObjects: { [id: string]: THREE.Object3D } = this._markerObjects;
        let node: Node = args.frame.state.currentNode;
        this._markerObjects = {};

        let boxWidth: number = 0.001;

        let minLon: number = node.latLon.lon - boxWidth / 2;
        let minLat: number = node.latLon.lat - boxWidth / 2;

        let maxLon: number = node.latLon.lon + boxWidth / 2;
        let maxLat: number = node.latLon.lat + boxWidth / 2;

        let markers: Marker[] = _.map(
            args.markers.search({ maxX: maxLon, maxY: maxLat, minX: minLon, minY: minLat }),
            (item: IMarkerIndexItem) => {
                return item.marker;
            }).filter((marker: Marker) => {
                return marker.visibleInKeys.length === 0 || _.contains(marker.visibleInKeys, node.key);
            });

        for (let marker of markers) {
            if (marker.id in oldObjects) {
                this._markerObjects[marker.id] = oldObjects[marker.id];
                delete oldObjects[marker.id];
            } else {
                let reference: ILatLonAlt = args.frame.state.reference;
                let p: number[] = (new GeoCoords).geodeticToEnu(
                    marker.latLonAlt.lat, marker.latLonAlt.lon, marker.latLonAlt.alt,
                    reference.lat, reference.lon, reference.alt);

                let o: THREE.Object3D = marker.createGeometry();
                o.position.set(p[0], p[1], p[2]);
                this._scene.add(o);
                this._markerObjects[marker.id] = o;
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
        for (let i in this._markerObjects) {
            if (this._markerObjects.hasOwnProperty(i)) {
                this._disposeObject(this._markerObjects[i]);
            }
        }
        this._markerObjects = {};
    }
}

ComponentService.register(MarkerComponent);
export default MarkerComponent;
