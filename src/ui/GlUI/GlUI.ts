/// <reference path="../../../typings/threejs/three.d.ts" />
/// <reference path="../../../node_modules/rx/ts/rx.all.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {IUI, Shaders, GlScene} from "../../UI";
import {ICurrentState} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {Transform, Camera} from "../../Geo";
import {Node} from "../../Graph";

export class GlUI implements IUI {
    private container: Container;
    private navigator: Navigator;

    private stateSubscription: rx.IDisposable;

    private renderer: THREE.WebGLRenderer;
    private needsRender: boolean;
    private camera: THREE.PerspectiveCamera;
    private imagePlaneScene: GlScene;

    private imagePlaneDistance: number = 200;

    private currentKey: string;
    private previousKey: string;

    constructor (container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;

        this.currentKey = null;
        this.previousKey = null;

        this.needsRender = false;
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
        this.imagePlaneScene = new GlScene();

        this.stateSubscription = this.navigator.stateService2.currentState.subscribe(
            this.onStateChanged.bind(this));
    }

    public deactivate(): void {
        this.stateSubscription.dispose();
    }

    private onStateChanged(state: ICurrentState): void {
        this.updateImagePlanes(state);
        this.updateCamera(state.camera);

        this.render(state.alpha);
    }

    private updateImagePlanes(state: ICurrentState): void {
        if (state.currentNode == null || state.currentNode.key === this.currentKey) {
            return;
        }

        this.previousKey = state.previousNode != null ? state.previousNode.key : null;
        if (this.previousKey != null) {
            if (this.previousKey !== this.currentKey) {
                this.imagePlaneScene.updateImagePlanes(
                    [this.createImagePlane(this.previousKey, state.previousTransform, state.previousNode)]);
            }
        }

        this.currentKey = state.currentNode.key;
        this.imagePlaneScene.updateImagePlanes(
            [this.createImagePlane(this.currentKey, state.currentTransform, state.currentNode)]);

        this.needsRender = true;
    }

    private render(alpha: number): void {
        if (!this.needsRender) {
            return;
        }

        this.needsRender = false;

        for (let plane of this.imagePlaneScene.imagePlanes) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = alpha;
        }

        for (let plane of this.imagePlaneScene.imagePlanesOld) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = 1;
        }

        this.renderer.render(this.imagePlaneScene.scene, this.camera);
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

        this.needsRender = true;
    }

    private createImagePlane(key: string, transform: Transform, node: Node): THREE.Mesh {
        let url: string = "https://d1cuyjsrcm0gby.cloudfront.net/" + key + "/thumb-320.jpg?origin=mapillary.webgl";

        let materialParameters: THREE.ShaderMaterialParameters = this.createMaterialParameters(transform);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        this.setTexture(material, url);

        let geometry: THREE.Geometry = this.getImagePlaneGeo(transform, node);
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

    private getImagePlaneGeo(transform: Transform, node: Node): THREE.Geometry {
        if (node.mesh == null ||
            transform.scale < 1e-2 ||
            transform.scale > 50) {
            return this.getFlatImagePlaneGeo(transform);
        }

        let geometry: THREE.Geometry = new THREE.Geometry();
        let t: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this.imagePlaneDistance * transform.scale;
        for (let v of node.mesh.vertices) {
            let z: number = Math.max(minZ, Math.min(v[2], maxZ));
            let factor: number = z / v[2];
            let p: THREE.Vector3 = new THREE.Vector3(v[0] * factor, v[1] * factor, z);
            p.applyMatrix4(t);
            geometry.vertices.push(p);
        }

        for (let f of node.mesh.faces) {
            geometry.faces.push(new THREE.Face3(f[0], f[1], f[2]));
        }

        return geometry;
    }

    private getFlatImagePlaneGeo(transform: Transform): THREE.Geometry {
        let width: number = transform.width;
        let height: number = transform.height;
        let size: number = Math.max(width, height);
        let dx: number = width / 2.0 / size;
        let dy: number = height / 2.0 / size;
        let tl: THREE.Vector3 = transform.pixelToVertex(-dx, -dy, this.imagePlaneDistance);
        let tr: THREE.Vector3 = transform.pixelToVertex( dx, -dy, this.imagePlaneDistance);
        let br: THREE.Vector3 = transform.pixelToVertex( dx, dy, this.imagePlaneDistance);
        let bl: THREE.Vector3 = transform.pixelToVertex(-dx, dy, this.imagePlaneDistance);

        let geometry: THREE.Geometry = new THREE.Geometry();

        geometry.vertices.push(tl, bl, br, tr);
        geometry.faces.push(new THREE.Face3(0, 1, 3), new THREE.Face3(1, 2, 3));

        return geometry;
    }
}

export default GlUI;
