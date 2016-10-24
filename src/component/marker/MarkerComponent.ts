/// <reference path="../../../typings/index.d.ts" />

import * as _ from "underscore";
import * as THREE from "three";
import * as rbush from "rbush";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

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
    ISpatialMarker,
    Marker,
    ComponentService,
    Component,
    SimpleMarker,
} from "../../Component";
import {IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
import {Node} from "../../Graph";
import {GeoCoords, ILatLonAlt} from "../../Geo";

export type MarkerIndex = rbush.RBush<ISpatialMarker>;

interface IMarkerData {
    hash: { [id: string]: ISpatialMarker };
    spatial: MarkerIndex;
}

interface IMarkerOperation extends Function {
    (markers: IMarkerData): IMarkerData;
}

interface IUpdateArgs {
    frame: IFrame;
    markers: MarkerIndex;
}

export class MarkerSet {
    private _create$: Subject<Marker> = new Subject<Marker>();
    private _remove$: Subject<string> = new Subject<string>();
    private _update$: Subject<IMarkerOperation> = new Subject<IMarkerOperation>();
    private _markers$: Observable<MarkerIndex>;

    constructor() {
        // markers list stream is the result of applying marker updates.
        this._markers$ = this._update$
            .scan(
                (markers: IMarkerData, operation: IMarkerOperation): IMarkerData => {
                    return operation(markers);
                },
                {hash: {}, spatial: rbush<ISpatialMarker>(16, [".lon", ".lat", ".lon", ".lat"])})
            .map(
                (markers: IMarkerData): MarkerIndex => {
                    return markers.spatial;
                })
            .publishReplay(1)
            .refCount();

        // creation stream generate creation updates from given markers.
        this._create$
            .map(
                (marker: Marker): IMarkerOperation => {
                    return (markers: IMarkerData) => {
                        if (markers.hash[marker.id]) {
                            markers.spatial.remove(markers.hash[marker.id]);
                        }

                        let rbushObj: ISpatialMarker = {
                            id: marker.id,
                            lat: marker.latLonAlt.lat,
                            lon: marker.latLonAlt.lon,
                            marker: marker,
                        };

                        markers.spatial.insert(rbushObj);
                        markers.hash[marker.id] = rbushObj;
                        return markers;
                    };
                })
            .subscribe(this._update$);

        // remove stream generates remove updates from given markers
        this._remove$
            .map(
                (id: string): IMarkerOperation => {
                    return (markers: IMarkerData) => {
                        let rbushObj: ISpatialMarker = markers.hash[id];
                        markers.spatial.remove(rbushObj);
                        delete markers.hash[id];
                        return markers;
                    };
                })
            .subscribe(this._update$);
    }

    public addMarker(marker: Marker): void {
        this._create$.next(marker);
    }

    public removeMarker(id: string): void {
        this._remove$.next(id);
    }

    public get markers$(): Observable<MarkerIndex> {
        return this._markers$;
    }
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
            .combineLatest<IUpdateArgs>(
                [
                    this._navigator.stateService.currentState$,
                    this._markerSet.markers$,
                ],
                (frame: IFrame, markers: MarkerIndex): IUpdateArgs => {
                    return { frame: frame, markers: markers };
                })
            .distinctUntilChanged(
                undefined,
                (args: IUpdateArgs): number => {
                    return args.frame.id;
                })
            .map<IGLRenderHash>(
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
        this._markerSet.addMarker(marker);
    }

    public get markers$(): Observable<MarkerIndex> {
        return this._markerSet.markers$;
    }

    public removeMarker(id: string): void {
        this._markerSet.removeMarker(id);
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
            (item: ISpatialMarker) => {
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
