/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";
import {Node} from "../Graph";
import {IActivatableUI} from "../UI";

export class RendererUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;

    constructor (container: HTMLElement) {
        this.renderer = new THREE.WebGLRenderer();

        let width: number = container.offsetWidth;
        this.renderer.setSize(width, width * 3 / 4);
        this.renderer.setClearColor(new THREE.Color(0x2020FF), 1.0);
        this.renderer.sortObjects = false;

        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(50, 4 / 3, 0.4, 1100);
        this.scene = new THREE.Scene();

        this.renderer.render(this.scene, this.camera);

        window.requestAnimationFrame(this.animate.bind(this));
    }

    public activate(): void {
        return;
    }

    public deactivate(): void {
        return;
    }

    public display(node: Node): void {
        return;
    }

    private animate(): void {
        window.requestAnimationFrame(this.animate.bind(this));

        this.renderer.render(this.scene, this.camera);
    }
}

export default RendererUI;
