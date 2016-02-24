/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {Transform} from "../Geo";

export class Camera {
    private _position: THREE.Vector3;
    private _lookat: THREE.Vector3;
    private _up: THREE.Vector3;
    private _focal: number;

    constructor(transform?: Transform) {
        if (transform != null) {
            this._position = transform.pixelToVertex(0, 0, 0);
            this._lookat = transform.pixelToVertex(0, 0, 10);
            this._up = transform.upVector();
            this._focal = this._getFocal(transform);
        } else {
            this._position = new THREE.Vector3(0, 0, 0);
            this._lookat = new THREE.Vector3(0, 0, 1);
            this._up = new THREE.Vector3(0, -1, 0);
            this._focal = 1;
        }
    }

    public get position(): THREE.Vector3 {
        return this._position;
    }

    public get lookat(): THREE.Vector3 {
        return this._lookat;
    }

    public get up(): THREE.Vector3 {
        return this._up;
    }

    public get focal(): number {
        return this._focal;
    }

    public set focal(value: number) {
        this._focal = value;
    }

    public lerpCameras(a: Camera, b: Camera, alpha: number): void {
      this._position.subVectors(b.position, a.position).multiplyScalar(alpha).add(a.position);
      this._lookat.subVectors(b.lookat, a.lookat).multiplyScalar(alpha).add(a.lookat);
      this._up.subVectors(b.up, a.up).multiplyScalar(alpha).add(a.up);
      this._focal = (1 - alpha) * a.focal + alpha * b.focal;
    }

    public copy(other: Camera): void {
        this._position.copy(other.position);
        this._lookat.copy(other.lookat);
        this._up.copy(other.up);
        this._focal = other.focal;
    }

    public clone(): Camera {
        let camera: Camera = new Camera();

        camera.position.copy(this._position);
        camera.lookat.copy(this._lookat);
        camera.up.copy(this._up);
        camera.focal = this._focal;

        return camera;
    }

    public diff(other: Camera): number {
        let pd: number = this._position.distanceToSquared(other.position);
        let ld: number = this._lookat.distanceToSquared(other.lookat);
        let ud: number = this._up.distanceToSquared(other.up);
        let fd: number = 100 * Math.abs(this._focal - other.focal);

        return Math.max(pd, ld, ud, fd);
    }

    private _getFocal(transform: Transform): number {
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
