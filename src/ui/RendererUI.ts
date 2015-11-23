/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";
import {Node} from "../Graph";
import {IActivatableUI} from "../UI";
import {StateContext} from "../State";

export class RendererUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;

    private currentKey: string;

    constructor (container: HTMLElement, state: StateContext) {
        this.renderer = new THREE.WebGLRenderer();

        let width: number = container.offsetWidth;
        this.renderer.setSize(width, width * 3 / 4);
        this.renderer.setClearColor(new THREE.Color(0x202020), 1.0);
        this.renderer.sortObjects = false;

        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(50, 1, 0.4, 1100);
        this.scene = new THREE.Scene();

        this.renderer.render(this.scene, this.camera);

        state.register(this.onStateUpdated);
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

    private onStateUpdated(node: Node): void {
        if (!node || this.currentKey === node.key) {
            return;
        }

        this.currentKey = node.key;
    }
}

export default RendererUI;
