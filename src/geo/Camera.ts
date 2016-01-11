/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {Transform} from "../Geo";

export class Camera {
    public position: THREE.Vector3;
    public lookat: THREE.Vector3;
    public up: THREE.Vector3;
    public focal: number;

    constructor(transform?: Transform) {
        if (transform != null) {
            this.position = transform.pixelToVertex(0, 0, 0);
            this.lookat = transform.pixelToVertex(0, 0, 10);
            this.up = transform.upVector();
            this.focal = transform.focal;
        } else {
            this.position = new THREE.Vector3(0, 0, 0);
            this.lookat = new THREE.Vector3(0, 0, 1);
            this.up = new THREE.Vector3(0, -1, 0);
            this.focal = 1;
        }
    }

    public lerpCameras(a: Camera, b: Camera, alpha: number): void {
      this.position.subVectors(b.position, a.position).multiplyScalar(alpha).add(a.position);
      this.lookat.subVectors(b.lookat, a.lookat).multiplyScalar(alpha).add(a.lookat);
      this.up.subVectors(b.up, a.up).multiplyScalar(alpha).add(a.up);
      this.focal = (1 - alpha) * a.focal + alpha * b.focal;
    }
}
