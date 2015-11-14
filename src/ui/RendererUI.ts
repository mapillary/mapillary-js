/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

export class RendererUI {
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;

    constructor (container: HTMLElement) {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(640, 480);
        this.renderer.setClearColor(new THREE.Color(0x202020), 1.0);
        this.renderer.sortObjects = false;

        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(50, 4 / 3, 0.4, 1100);
        this.scene = new THREE.Scene();

        this.renderer.render(this.scene, this.camera);
    }
}

export default RendererUI;
