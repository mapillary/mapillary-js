/// <reference path="../../../typings/threejs/three.d.ts" />
/// <reference path="../../../node_modules/rx/ts/rx.all.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {IUI, Shaders} from "../../UI";
import {ICurrentState2} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {Transform, Camera} from "../../Geo";

export class GlUI implements IUI {
    private container: Container;
    private navigator: Navigator;

    private stateSubscription: rx.IDisposable;

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private imagePlane: THREE.Mesh;
    private imagePlaneOld: THREE.Mesh;

    private imagePlaneSize: number = 200;

    private currentKey: string;
    private previousKey: string;

    constructor (container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;

        this.currentKey = null;
    }

    public activate(): void {
        this.renderer = new THREE.WebGLRenderer();

        let width: number = this.container.element.offsetWidth;
        this.renderer.setSize(width, width * 3 / 4);
        this.renderer.setClearColor(new THREE.Color(0x202020), 1.0);
        this.renderer.sortObjects = false;

        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        this.container.element.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(50, 4 / 3, 0.4, 10000);
        this.scene = new THREE.Scene();

        this.renderer.render(this.scene, this.camera);

        this.stateSubscription = this.navigator.stateService2.currentState.subscribe(
            this.onStateChanged.bind(this));
    }

    public deactivate(): void {
        this.stateSubscription.dispose();
    }

    private onStateChanged(state: ICurrentState2): void {
        this.updateImagePlanes(state);
        this.updateCamera(state.camera);

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
                this.imagePlaneOld = this.createImagePlane(this.previousKey, state.previousTransform);
            }
        }

        this.currentKey = state.currentNode.key;
        this.imagePlane = this.createImagePlane(this.currentKey, state.currentTransform);

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

    private getVerticalFov(aspect: number, camera: Camera): number {
        let focal: number = camera.focal;
        let verticalFov: number = 2 * Math.atan(0.5 / aspect / focal) * 180 / Math.PI;

        return verticalFov;
    }

    private updateCamera(camera: Camera): void {
        let verticalFov: number = this.getVerticalFov(4 / 3, camera);

        this.camera.fov = verticalFov;
        this.camera.updateProjectionMatrix();

        this.camera.up.copy(camera.up);
        this.camera.position.copy(camera.position);
        this.camera.lookAt(camera.lookat);
    }

    private createImagePlane(key: string, transform: Transform): THREE.Mesh {
        let url: string = "https://d1cuyjsrcm0gby.cloudfront.net/" + key + "/thumb-320.jpg?origin=mapillary.webgl";

        let materialParameters: THREE.ShaderMaterialParameters = this.createMaterialParameters(transform);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        this.setTexture(material, url);

        let geometry: THREE.Geometry = this.getFlatImagePlaneGeo(transform);
        let mesh: THREE.Mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }

    private createMaterialParameters(transform: Transform): THREE.ShaderMaterialParameters {
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
                    value: transform.projectorMatrix(),
                },
                projectorTex: {
                    type: "t",
                    value: null,
                },
            },
            vertexShader: Shaders.perspective.vertex,
        };

        return materialParameters;
    }

    private setTexture(material: THREE.ShaderMaterial, url: string): void {
        material.visible = false;

        let textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = "Anonymous";
        textureLoader.load(url, (texture: THREE.Texture) => {
            texture.minFilter = THREE.LinearFilter;
            material.uniforms.projectorTex.value = texture;
            material.visible = true;
        });
    }

    private getFlatImagePlaneGeo(transform: Transform): THREE.Geometry {
        let width: number = transform.width;
        let height: number = transform.height;
        let size: number = Math.max(width, height);
        let dx: number = width / 2.0 / size;
        let dy: number = height / 2.0 / size;
        let tl: THREE.Vector3 = transform.pixelToVertex(-dx, -dy, this.imagePlaneSize);
        let tr: THREE.Vector3 = transform.pixelToVertex( dx, -dy, this.imagePlaneSize);
        let br: THREE.Vector3 = transform.pixelToVertex( dx, dy, this.imagePlaneSize);
        let bl: THREE.Vector3 = transform.pixelToVertex(-dx, dy, this.imagePlaneSize);

        let geometry: THREE.Geometry = new THREE.Geometry();

        geometry.vertices.push(tl, bl, br, tr);
        geometry.faces.push(new THREE.Face3(0, 1, 3), new THREE.Face3(1, 2, 3));

        return geometry;
    }
}

export default GlUI;
