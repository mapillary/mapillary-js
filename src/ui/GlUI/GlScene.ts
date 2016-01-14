/// <reference path="../../../typings/threejs/three.d.ts" />

import * as THREE from "three";

export class GlScene {
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
        for (let plane of this.imagePlanesOld) {
            this.sceneOld.remove(plane);
            plane.geometry.dispose();
            plane.material.dispose();
        }

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
}
