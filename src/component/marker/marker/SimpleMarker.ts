import * as THREE from "three";

import {ILatLon} from "../../../API";
import {
    ISimpleMarkerOptions,
    Marker,
} from "../../../Component";

/**
 * @class SimpleMarker
 *
 * @classdesc Interactive marker with ice cream shape. The sphere
 * inside the ice cream can be configured to be interactive.
 *
 * Simple marker properties can not be updated after creation.
 *
 * To create and add one `SimpleMarker` with default configuration
 * (non-interactive) and one interactive with configuration use
 *
 * @example
 * ```
 * var defaultMarker = new Mapillary.MarkerComponent.SimpleMarker(
 *     "id-1",
 *     { lat: 0, lon: 0, });
 *
 * var interactiveMarker = new Mapillary.MarkerComponent.SimpleMarker(
 *     "id-2",
 *     { lat: 0, lon: 0, },
 *     {
 *         ballColor: "#00f",
 *         ballOpacity: 0.5,
 *         color: "#00f",
 *         interactive: true,
 *         opacity: 0.3,
 *         radius: 0.7,
 *     });
 *
 * markerComponent.add([defaultMarker, interactiveMarker]);
 * ```
 */
export class SimpleMarker extends Marker {
    private _ballColor: number | string;
    private _ballOpacity: number;
    private _circleToRayAngle: number;
    private _color: number | string;
    private _interactive: boolean;
    private _opacity: number;
    private _radius: number;

    constructor(id: string, latLon: ILatLon, options?: ISimpleMarkerOptions) {
        super(id, latLon);

        options = !!options ? options : {};
        this._ballColor = options.ballColor != null ? options.ballColor : 0xff0000;
        this._ballOpacity = options.ballOpacity != null ? options.ballOpacity : 0.8;
        this._circleToRayAngle = 2;
        this._color = options.color != null ? options.color : 0xff0000;
        this._interactive = !!options.interactive;
        this._opacity = options.opacity != null ? options.opacity : 0.4;
        this._radius = options.radius != null ? options.radius : 1;
    }

    protected _createGeometry(position: number[]): void {
        const radius: number = this._radius;
        const cone: THREE.Mesh = new THREE.Mesh(
            this._markerGeometry(radius, 8, 8),
            new THREE.MeshBasicMaterial({
                color: this._color,
                opacity: this._opacity,
                transparent: true,
            }));

        cone.renderOrder = 1;

        const ball: THREE.Mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius / 2, 8, 8),
            new THREE.MeshBasicMaterial({
                color: this._ballColor,
                opacity: this._ballOpacity,
                transparent: true,
            }));

        ball.position.z = this._markerHeight(radius);

        const group: THREE.Object3D = new THREE.Object3D();
        group.add(ball);
        group.add(cone);
        group.position.fromArray(position);

        this._geometry = group;
    }

    protected _disposeGeometry(): void {
        for (let mesh of <THREE.Mesh[]>this._geometry.children) {
            mesh.geometry.dispose();
            (<THREE.Material>mesh.material).dispose();
        }
    }

    protected _getInteractiveObjects(): THREE.Object3D[] {
        return this._interactive ? [this._geometry.children[0]] : [];
    }

    private _markerHeight(radius: number): number {
        let t: number = Math.tan(Math.PI - this._circleToRayAngle);
        return radius * Math.sqrt(1 + t * t);
    }

    private _markerGeometry(radius: number, widthSegments: number, heightSegments: number): THREE.Geometry {
        let geometry: THREE.Geometry = new THREE.Geometry();

        widthSegments = Math.max(3, Math.floor(widthSegments) || 8);
        heightSegments = Math.max(2, Math.floor(heightSegments) || 6);
        let height: number = this._markerHeight(radius);

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
}

export default SimpleMarker;
