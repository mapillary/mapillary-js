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
            this.focal = this.getFocal(transform);
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

    public copy(other: Camera): void {
        this.position.copy(other.position);
        this.lookat.copy(other.lookat);
        this.up.copy(other.up);
        this.focal = other.focal;
    }

    public clone(): Camera {
        let camera: Camera = new Camera();

        camera.position.copy(this.position);
        camera.lookat.copy(this.lookat);
        camera.up.copy(this.up);
        camera.focal = this.focal;

        return camera;
    }

    public diff(other: Camera): number {
        let pd: number = this.position.distanceToSquared(other.position);
        let ld: number = this.lookat.distanceToSquared(other.lookat);
        let ud: number = this.up.distanceToSquared(other.up);
        let fd: number = 100 * Math.abs(this.focal - other.focal);

        return Math.max(pd, ld, ud, fd);
    }

    private getFocal(transform: Transform): number {
        if (transform.gpano != null) {
            return 0.5;
        }

        let size: number = Math.max(transform.width, transform.height);
        if (transform.orientation > 4) {
            return transform.focal / size * transform.height;
        }

        return transform.focal / size * transform.width;
    }
}
