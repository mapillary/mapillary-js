/// <reference path="../../../typings/browser.d.ts" />

import * as _ from "underscore";
import * as THREE from "three";
import * as rbush from "rbush";
import * as rx from "rx";

import {Marker, ComponentService, Component} from "../../Component";
import {IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
import {Graph, ILatLonAlt, Node} from "../../Graph";
import {GeoCoords} from "../../Geo";

interface IMarkerOperation extends Function {
    (markers: any): any;
}

interface IUpdateArgs {
    graph: Graph;
    frame: IFrame;
    markers: any;
}

export class MarkerSet {
    private _create$: rx.Subject<Marker> = new rx.Subject<Marker>();
    private _remove$: rx.Subject<Marker> = new rx.Subject<Marker>();
    private _update$: rx.Subject<any> = new rx.Subject<any>();
    private _markers$: rx.Observable<any>;

    constructor() {
        // markers list stream is the result of applying marker updates.
        this._markers$ = this._update$
            .scan(
                (markers: any, operation: IMarkerOperation): any => {
                    return operation(markers);
                },
                rbush(20000, [".lon", ".lat", ".lon", ".lat"])
            )
            .shareReplay(1);

        // creation stream generate creation updates from given markers.
        this._create$
            .map(function(marker: Marker): IMarkerOperation {
                return (markers: any) => {
                    markers.insert({lat: marker.lat, lon: marker.lon, marker: marker});
                    return markers;
                };
            })
            .subscribe(this._update$);

        // creation stream generate creation updates from given markers.
        this._remove$
            .map(function(marker: Marker): IMarkerOperation {
                return (markers: any) => {
                    markers.remove(marker);
                    return markers;
                };
            })
            .subscribe(this._update$);
    }

    public addMarker(marker: Marker): void {
        this._create$.onNext(marker);
    }

    public removeMarker(marker: Marker): void {
        this._remove$.onNext(marker);
    }

    public get markers$(): rx.Observable<Marker[]> {
        return this._markers$;
    }
}


export class MarkerComponent extends Component {
    public static componentName: string = "marker";

    private _disposable: rx.IDisposable;
    private _disposableMapillaryObject: rx.IDisposable;
    private _markerSet: MarkerSet;

    private _scene: THREE.Scene;
    private _markerObjects: {[hash: number]: THREE.Object3D};
    private _circleToRayAngle: number = 2.0;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._scene = new THREE.Scene();
        this._markerSet = new MarkerSet();
        this._markerObjects = {};

        this._disposable = rx.Observable.combineLatest(
            this._navigator.graphService.graph$,
            this._navigator.stateService.currentState$,
            this._markerSet.markers$,
            (graph: Graph, frame: IFrame, markers: any): IUpdateArgs => {
                return { frame: frame, graph: graph, markers: markers };
            })
            .distinctUntilChanged((args: IUpdateArgs) => {
                return args.frame.id;
            })
            .map<IGLRenderHash>((args: IUpdateArgs): IGLRenderHash => {
                return this.renderHash(args);
            })
            .subscribe(this._container.glRenderer.render$);

        this._disposableMapillaryObject =
            this._navigator.graphService.googleTilesService.mapillaryObjects$.subscribe((object: any) => {
                let marker: Marker = this.createMarker(object.l.lat, object.l.lon, object.alt);
                this.addMarker(marker);
            });
    }

    protected _deactivate(): void {
        // release memory
        this.disposeScene();
        this._disposable.dispose();
        this._disposableMapillaryObject.dispose();
    }

    public createMarker(lat: number, lon: number, alt: number): Marker {
        return new Marker(lat, lon, alt);
    }

    public addMarker(marker: Marker): void {
        this._markerSet.addMarker(marker);
    }

    public removeMarker(marker: Marker): void {
        this._markerSet.removeMarker(marker);
    }

    private renderHash(args: IUpdateArgs): IGLRenderHash {
        // determine if render is needed while updating scene
        // specific properies.
        let needsRender: boolean = this.updateScene(args);

        // return render hash with render function and
        // render in foreground.
        return {
            name: this._name,
            render: {
                frameId: args.frame.id,
                needsRender: needsRender,
                render: this.render.bind(this),
                stage: GLRenderStage.Foreground,
            },
        };
    }

    private updateScene(args: IUpdateArgs): boolean {
        if (!args.frame ||
            !args.graph ||
            !args.markers ||
            !args.frame.state.currentNode) {
            return false;
        }

        let needRender: boolean = false;
        let oldObjects: { [hash: number]: THREE.Object3D } = this._markerObjects;
        let node: Node = args.frame.state.currentNode;
        this._markerObjects = {};

        let boxWidth: number = 0.001;

        let minLon: number = node.latLon.lon - boxWidth / 2;
        let minLat: number = node.latLon.lat - boxWidth / 2;

        let maxLon: number = node.latLon.lon + boxWidth / 2;
        let maxLat: number = node.latLon.lat + boxWidth / 2;

        let markers: Marker[] = _.map(args.markers.search([minLon, minLat, maxLon, maxLat]), (item: any) => {
            return <Marker>item.marker;
        });

        for (let marker of markers) {
            if (marker.hash in oldObjects) {
                this._markerObjects[marker.hash] = oldObjects[marker.hash];
                delete oldObjects[marker.hash];
            } else {
                let reference: ILatLonAlt = args.graph.referenceLatLonAlt;
                let p: number[] = (new GeoCoords).topocentric_from_lla(
                    marker.lat, marker.lon, marker.alt,
                    reference.lat, reference.lon, reference.alt);

                let o: THREE.Object3D = this.createMarkerGeometry(marker.color);
                o.position.set(p[0], p[1], p[2]);
                this._scene.add(o);
                this._markerObjects[marker.hash] = o;
                needRender = true;
            }
        }

        for (let i in oldObjects) {
            if (oldObjects.hasOwnProperty(i)) {
                this.disposeObject(oldObjects[i]);
                needRender = true;
            }
        }

        return needRender;
    }

    private render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);
    }

    private createMarkerGeometry(color: number): THREE.Object3D {
        let radius: number = 2;

        let cone: THREE.Mesh = new THREE.Mesh(
            this.markerGeometry(radius, 16, 8),
            new THREE.MeshBasicMaterial({
                color: color,
                depthWrite: false,
                opacity: 0.4,
                shading: THREE.SmoothShading,
                transparent: true,
            })
        );

        let ball: THREE.Mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius / 2, 16, 8),
            new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                depthWrite: false,
                opacity: 0.6,
                shading: THREE.SmoothShading,
                transparent: true,
            })
        );
        ball.position.z = this.markerHeight(radius);

        let group: THREE.Object3D = new THREE.Object3D();
        group.add(ball);
        group.add(cone);
        return group;
    }

    private markerHeight(radius: number): number {
        let t: number = Math.tan(Math.PI - this._circleToRayAngle);
        return radius * Math.sqrt(1 + t * t);
    }

    private markerGeometry(
            radius: number,
            widthSegments: number,
            heightSegments: number ): THREE.Geometry {

        let geometry: THREE.Geometry = new THREE.Geometry();

        widthSegments = Math.max(3, Math.floor(widthSegments) || 8);
        heightSegments = Math.max(2, Math.floor(heightSegments) || 6);
        let height: number = this.markerHeight(radius);

        let vertices: any[] = [];

        for (let y: number = 0; y <= heightSegments; ++y) {

            let verticesRow: any[] = [];

            for (let x: number = 0; x <= widthSegments; ++x) {
                let u: number = x / widthSegments * Math.PI * 2;
                let v: number = y / heightSegments * Math.PI;

                let r: number;
                if (v < this._circleToRayAngle) {
                    r = radius;
                } else {
                    let t: number = Math.tan(v - this._circleToRayAngle);
                    r = radius * Math.sqrt(1 + t * t);
                }

                let vertex: THREE.Vector3 = new THREE.Vector3();
                vertex.x = r * Math.cos(u) * Math.sin(v);
                vertex.y = r * Math.sin(u) * Math.sin(v);
                vertex.z = r * Math.cos(v) + height;

                geometry.vertices.push(vertex);
                verticesRow.push(geometry.vertices.length - 1);
            }
            vertices.push(verticesRow);
        }

        for (let y: number = 0; y < heightSegments; ++y) {
            for (let x: number = 0; x < widthSegments; ++x) {
                let v1: number = vertices[y][x + 1];
                let v2: number = vertices[y][x];
                let v3: number = vertices[y + 1][x];
                let v4: number = vertices[y + 1][x + 1];

                let n1: THREE.Vector3 = geometry.vertices[v1].clone().normalize();
                let n2: THREE.Vector3 = geometry.vertices[v2].clone().normalize();
                let n3: THREE.Vector3 = geometry.vertices[v3].clone().normalize();
                let n4: THREE.Vector3 = geometry.vertices[v4].clone().normalize();

                geometry.faces.push(new THREE.Face3(v1, v2, v4, [n1, n2, n4]));
                geometry.faces.push(new THREE.Face3(v2, v3, v4, [n2.clone(), n3, n4.clone()]));
            }
        }

        geometry.computeFaceNormals();
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius + height);
        return geometry;
    }

    private disposeObject(object: THREE.Object3D): void {
        this._scene.remove(object);
        for (let i: number = 0; i < object.children.length; ++i) {
            let c: THREE.Mesh = <THREE.Mesh> object.children[i];
            c.geometry.dispose();
            c.material.dispose();
        }
    }

    private disposeScene(): void {
        for (let i in this._markerObjects) {
            if (this._markerObjects.hasOwnProperty(i)) {
                this.disposeObject(this._markerObjects[i]);
            }
        }
        this._markerObjects = {};
    }
}

ComponentService.register(MarkerComponent);
export default MarkerComponent;
