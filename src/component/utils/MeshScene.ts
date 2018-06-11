import * as THREE from "three";

import {IShaderMaterial} from "../../Component";

export class MeshScene {
    public scene: THREE.Scene;
    public sceneOld: THREE.Scene;

    public imagePlanes: THREE.Mesh[];
    public imagePlanesOld: THREE.Mesh[];

    constructor() {
        this.scene = new THREE.Scene();
        this.sceneOld = new THREE.Scene();

        this.imagePlanes = [];
        this.imagePlanesOld = [];
    }

    public updateImagePlanes(planes: THREE.Mesh[]): void {
        this._dispose(this.imagePlanesOld, this.sceneOld);

        for (let plane of this.imagePlanes) {
            this.scene.remove(plane);
            this.sceneOld.add(plane);
        }

        for (let plane of planes) {
            this.scene.add(plane);
        }

        this.imagePlanesOld = this.imagePlanes;
        this.imagePlanes = planes;
    }

    public addImagePlanes(planes: THREE.Mesh[]): void {
        for (let plane of planes) {
            this.scene.add(plane);
            this.imagePlanes.push(plane);
        }
    }

    public addImagePlanesOld(planes: THREE.Mesh[]): void {
        for (let plane of planes) {
            this.sceneOld.add(plane);
            this.imagePlanesOld.push(plane);
        }
    }

    public setImagePlanes(planes: THREE.Mesh[]): void {
        this._clear();
        this.addImagePlanes(planes);
    }

    public setImagePlanesOld(planes: THREE.Mesh[]): void {
        this._clearOld();
        this.addImagePlanesOld(planes);
    }

    public clear(): void {
        this._clear();
        this._clearOld();
    }

    private _clear(): void {
        this._dispose(this.imagePlanes, this.scene);
        this.imagePlanes.length = 0;
    }

    private _clearOld(): void {
        this._dispose(this.imagePlanesOld, this.sceneOld);
        this.imagePlanesOld.length = 0;
    }

    private _dispose(planes: THREE.Mesh[], scene: THREE.Scene): void {
        for (let plane of planes) {
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
