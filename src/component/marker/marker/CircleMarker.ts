/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";

import {ILatLon} from "../../../API";
import {Marker} from "../../../Component";

export class CircleMarker extends Marker {
    constructor(id: string, latLon: ILatLon) {
        super(id, latLon);
    }

    protected _createGeometry(position: number[]): void {
        let radius: number = 1;
        let circle: THREE.Mesh = new THREE.Mesh(
            new THREE.CircleGeometry(radius, 16),
            new THREE.MeshBasicMaterial({
                color: "#0f0",
                opacity: 0.6,
                transparent: true,
            }));

        circle.up.fromArray([0, 0, 1]);
        circle.renderOrder = -1;

        let group: THREE.Object3D = new THREE.Object3D();
        group.add(circle);
        group.position.fromArray(position);

        this._geometry = group;
    }

    protected _disposeGeometry(): void {
        for (let mesh of <THREE.Mesh[]>this._geometry.children) {
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
    }
}

export default CircleMarker;
