/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";

import {ILatLon} from "../../../API";
import {
    ISimpleMarkerOptions,
    Marker,
} from "../../../Component";

export class SimpleMarker extends Marker {
    private _circleToRayAngle: number = 2.0;
    private _simpleMarkerOptions: ISimpleMarkerOptions;

    constructor(id: string, latLon: ILatLon, options: ISimpleMarkerOptions) {
        super(id, latLon);

        this._simpleMarkerOptions = options;
    }

    protected _createGeometry(position: number[]): void {
        let radius: number = 1;

        let cone: THREE.Mesh = new THREE.Mesh(
            this._markerGeometry(radius, 8, 8),
            new THREE.MeshBasicMaterial({
                color: this._simpleMarkerOptions.ballColor,
                opacity: this._simpleMarkerOptions.opacity,
                shading: THREE.SmoothShading,
                transparent: true,
            }));

        cone.renderOrder = 1;

        let ball: THREE.Mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius / 2, 8, 8),
            new THREE.MeshBasicMaterial({
                color: this._simpleMarkerOptions.ballColor,
                opacity: this._simpleMarkerOptions.ballOpacity,
                shading: THREE.SmoothShading,
                transparent: true,
            }));

        ball.position.z = this._markerHeight(radius);

        let group: THREE.Object3D = new THREE.Object3D();
        group.add(ball);
        group.add(cone);
        group.position.fromArray(position);

        this._geometry = group;
    }

    protected _disposeGeometry(): void {
        for (let mesh of <THREE.Mesh[]>this._geometry.children) {
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
    }

    protected _getDraggableObjectIds(): string[] {
        return !!this._simpleMarkerOptions.draggable ?
            [this._geometry.children[0].uuid] : [];
    }

    private _markerHeight(radius: number): number {
        let t: number = Math.tan(Math.PI - this._circleToRayAngle);
        return radius * Math.sqrt(1 + t * t);
    }

    private _markerGeometry(radius: number, widthSegments: number, heightSegments: number ): THREE.Geometry {
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
