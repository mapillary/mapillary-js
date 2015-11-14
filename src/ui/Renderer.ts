/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

export class Renderer {
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;

    constructor () {
        this.renderer = new THREE.WebGLRenderer();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.4, 1100);
    }
}

export default Renderer
