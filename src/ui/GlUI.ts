/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";
import {IUI, Shaders} from "../UI";
import {Navigator} from "../Viewer";
import {ICurrentState2} from "../State";

export class GlUI implements IUI {
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private imagePlane: THREE.Mesh;
    private imagePlaneOld: THREE.Mesh;

    private currentKey: string;
    private previousKey: string;

    constructor (container: HTMLElement, navigator: Navigator) {
        this.currentKey = null;

        this.renderer = new THREE.WebGLRenderer();

        let width: number = container.offsetWidth;
        this.renderer.setSize(width, width * 3 / 4);
        this.renderer.setClearColor(new THREE.Color(0x202020), 1.0);
        this.renderer.sortObjects = false;

        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(2 * Math.atan(0.5) * 180 / Math.PI, 4 / 3, 0.4, 1100);
        this.camera.lookAt(new THREE.Vector3(0, 0, 1));
        this.scene = new THREE.Scene();

        this.renderer.render(this.scene, this.camera);

        navigator.stateService2.currentState.subscribe(this.onStateChanged.bind(this));
    }

    public activate(): void {
        return;
    }

    public deactivate(): void {
        return;
    }

    private onStateChanged(state: ICurrentState2): void {
        this.updateImagePlanes(state);

        this.render(state.alpha);
    }

    private updateImagePlanes(state: ICurrentState2): void {
        if (state.currentNode == null || state.currentNode.key === this.currentKey) {
            return;
        }

        if (this.imagePlaneOld) {
            this.scene.remove(this.imagePlaneOld);
            this.imagePlaneOld = null;
        }

        this.previousKey = state.previousNode != null ? state.previousNode.key : null;
        if (this.previousKey != null) {
            if (this.previousKey === this.currentKey) {
                this.imagePlaneOld = this.imagePlane;
            } else {
                this.imagePlaneOld = this.createImagePlane(this.previousKey);
            }
        }

        this.currentKey = state.currentNode.key;
        this.imagePlane = this.createImagePlane(this.currentKey);

        this.scene.add(this.imagePlane);
    }

    private render(alpha: number): void {
        if (this.imagePlane) {
            (<THREE.ShaderMaterial>this.imagePlane.material).uniforms.opacity.value = alpha;
        }

        if (this.imagePlaneOld) {
            (<THREE.ShaderMaterial>this.imagePlaneOld.material).uniforms.opacity.value = 1;
        }

        this.renderer.render(this.scene, this.camera);
    }

    private createImagePlane(key: string): THREE.Mesh {
        let url: string = "https://d1cuyjsrcm0gby.cloudfront.net/" + key + "/thumb-320.jpg?origin=mapillary.webgl";

        let projection: THREE.Matrix4 = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 0, 0,
            0, 0, 1, 0
        );

        let projectorMat: THREE.Matrix4 = new THREE.Matrix4().set(
            -3 / 4, 0, 0,
            0.5, 0, 1, 0,
            0.5, 0, 0, 1,
            0, 0, 0, 0, 1
        );

        projectorMat.multiply(projection);

        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.perspective.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                opacity: {
                    type: "f",
                    value: 1,
                },
                projectorMat: {
                    type: "m4",
                    value: projectorMat,
                },
                projectorTex: {
                    type: "t",
                    value: null,
                },
            },
            vertexShader: Shaders.perspective.vertex,
        };

        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = "Anonymous";
        textureLoader.load(url, (texture: THREE.Texture) => {
            texture.minFilter = THREE.LinearFilter;
            material.uniforms.projectorTex.value = texture;
        });

        let geometry: THREE.Geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(-4 / 3, 1, 2),
            new THREE.Vector3(4 / 3, 1, 2),
            new THREE.Vector3(4 / 3, -1, 2),
            new THREE.Vector3(-4 / 3, -1, 2)
        );
        geometry.faces.push(
            new THREE.Face3(0, 1, 3),
            new THREE.Face3(1, 2, 3)
        );

        let mesh: THREE.Mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }
}

export default GlUI;
