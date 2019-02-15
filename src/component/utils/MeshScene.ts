import * as THREE from "three";

import {IShaderMaterial} from "../../Component";

export class MeshScene {
    private _planes: { [key: string]: THREE.Mesh };
    private _planesOld: { [key: string]: THREE.Mesh };
    private _planesPeriphery: { [key: string]: THREE.Mesh };

    private _scene: THREE.Scene;
    private _sceneOld: THREE.Scene;
    private _scenePeriphery: THREE.Scene;

    constructor() {
        this._planes = {};
        this._planesOld = {};
        this._planesPeriphery = {};

        this._scene = new THREE.Scene();
        this._sceneOld = new THREE.Scene();
        this._scenePeriphery = new THREE.Scene();
    }

    public get planes(): { [key: string]: THREE.Mesh } {
        return this._planes;
    }

    public get planesOld(): { [key: string]: THREE.Mesh } {
        return this._planesOld;
    }

    public get planesPeriphery(): { [key: string]: THREE.Mesh } {
        return this._planesPeriphery;
    }

    public get scene(): THREE.Scene {
        return this._scene;
    }

    public get sceneOld(): THREE.Scene {
        return this._sceneOld;
    }

    public get scenePeriphery(): THREE.Scene {
        return this._scenePeriphery;
    }

    public updateImagePlanes(planes: { [key: string]: THREE.Mesh }): void {
        this._dispose(this._planesOld, this.sceneOld);

        for (const key in this._planes) {
            if (!this._planes.hasOwnProperty(key)) {
                continue;

            }

            const plane: THREE.Mesh = this._planes[key];
            this._scene.remove(plane);
            this._sceneOld.add(plane);
        }

        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            this._scene.add(planes[key]);
        }

        this._planesOld = this._planes;
        this._planes = planes;
    }

    public addImagePlanes(planes: { [key: string]: THREE.Mesh }): void {
        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            this._scene.add(plane);
            this._planes[key] = plane;
        }
    }

    public addImagePlanesOld(planes: { [key: string]: THREE.Mesh }): void {
        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            this._sceneOld.add(plane);
            this._planesOld[key] = plane;
        }
    }

    public setImagePlanes(planes: { [key: string]: THREE.Mesh }): void {
        this._clear();
        this.addImagePlanes(planes);
    }

    public addPeripheryPlanes(planes: { [key: string]: THREE.Mesh }): void {
        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            this._scenePeriphery.add(plane);
            this._planesPeriphery[key] = plane;
        }
    }

    public setPeripheryPlanes(planes: { [key: string]: THREE.Mesh }): void {
        this._clearPeriphery();
        this.addPeripheryPlanes(planes);
    }

    public setImagePlanesOld(planes: { [key: string]: THREE.Mesh }): void {
        this._clearOld();
        this.addImagePlanesOld(planes);
    }

    public clear(): void {
        this._clear();
        this._clearOld();
    }

    private _clear(): void {
        this._dispose(this._planes, this._scene);
        this._planes = {};
    }

    private _clearOld(): void {
        this._dispose(this._planesOld, this._sceneOld);
        this._planesOld = {};
    }

    private _clearPeriphery(): void {
        this._dispose(this._planesPeriphery, this._scenePeriphery);
        this._planesPeriphery = {};
    }

    private _dispose(planes: { [key: string]: THREE.Mesh }, scene: THREE.Scene): void {
        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            scene.remove(plane);
            plane.geometry.dispose();
            (<THREE.Material>plane.material).dispose();
            let texture: THREE.Texture = (<IShaderMaterial>plane.material).uniforms.projectorTex.value;
            if (texture != null) {
                texture.dispose();
            }
        }
    }
}

export default MeshScene;
