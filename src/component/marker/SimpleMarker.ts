import * as THREE from "three";

import {IMarkerOptions, ISimpleMarkerStyle, Marker} from "../../Component";
import {ILatLonAlt} from "../../Graph";

export class SimpleMarker extends Marker {
    private _circleToRayAngle: number = 2.0;
    private _simpleMarkerStyle: ISimpleMarkerStyle;

    constructor(latLonAlt: ILatLonAlt, markerOptions: IMarkerOptions) {
        super(latLonAlt, markerOptions);
        this._simpleMarkerStyle = <ISimpleMarkerStyle> markerOptions.style;
    }

    public createGeometry(): THREE.Object3D {
        let radius: number = 2;

        let cone: THREE.Mesh = new THREE.Mesh(
            this._markerGeometry(radius, 16, 8),
            new THREE.MeshBasicMaterial({
                color: this._stringToRBG(this._simpleMarkerStyle.color),
                depthWrite: false,
                opacity: this._simpleMarkerStyle.opacity,
                shading: THREE.SmoothShading,
                transparent: true,
            })
        );

        let ball: THREE.Mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius / 2, 16, 8),
            new THREE.MeshBasicMaterial({
                color: this._stringToRBG(this._simpleMarkerStyle.ballColor),
                depthWrite: false,
                opacity: this._simpleMarkerStyle.ballOpacity,
                shading: THREE.SmoothShading,
                transparent: true,
            })
        );
        ball.position.z = this._markerHeight(radius);

        let group: THREE.Object3D = new THREE.Object3D();
        group.add(ball);
        group.add(cone);
        return group;
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

    private _stringToRBG(str: string): number {
        let ret: number = 0;
        for (let i: number = 0; i < str.length; i++) {
            ret = str.charCodeAt(i) + ((ret << 5) - ret);
        }
        return ret;
    }

}

export default SimpleMarker;
