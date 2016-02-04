/// <reference path="../../../typings/threejs/three.d.ts" />
/// <reference path="../../../node_modules/rx/ts/rx.all.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {IGPano} from "../../API";
import {UIService, UI, Shaders, ImagePlaneScene} from "../../UI";
import {ICurrentState, IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage, IGLRenderFunction} from "../../Render";
import {Transform, Camera} from "../../Geo";
import {Node} from "../../Graph";

export class GLUI extends UI {
    public static uiName: string = "gl";
    private _disposable: rx.IDisposable;

    private alpha: number;
    private alphaOld: number;
    private fadeOutSpeed: number;
    private lastCamera: Camera;
    private epsilon: number;
    private imagePlaneScene: ImagePlaneScene;

    private imagePlaneDepth: number = 200;
    private imageSphereRadius: number = 200;

    private currentKey: string;
    private previousKey: string;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this.currentKey = null;
        this.previousKey = null;

        this.alpha = 0;
        this.alphaOld = 0;
        this.fadeOutSpeed = 0.05;
        this.lastCamera = new Camera();
        this.epsilon = 0.000001;

        this.imagePlaneScene = new ImagePlaneScene();

        let render: IGLRenderFunction = this.render.bind(this);

        this._disposable = this._navigator.stateService.currentState$
            .map<IGLRenderHash>((frame: IFrame): IGLRenderHash => {
                let needsRender: boolean = this.updateImagePlanes(frame.state);
                needsRender = this.updateAlpha(frame.state.alpha) || needsRender;
                needsRender = this.updateAlphaOld(frame.state.alpha) || needsRender;

                return {
                    name: this._name,
                    render: {
                        frameId: frame.id,
                        needsRender: needsRender,
                        render: render,
                        stage: GLRenderStage.BACKGROUND,
                    },
                };
            })
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        this.imagePlaneScene.clear();
        this._disposable.dispose();
    }

    private updateAlpha(alpha: number): boolean {
        if (alpha === this.alpha) {
            return false;
        }

        this.alpha = alpha;

        return true;
    }

    private updateAlphaOld(alpha: number): boolean {
        if (alpha < 1 || this.alphaOld === 0) {
            return false;
        }

        this.alphaOld = Math.max(0, this.alphaOld - this.fadeOutSpeed);

        return true;
    }

    private updateImagePlanes(state: ICurrentState): boolean {
        if (state.currentNode == null || state.currentNode.key === this.currentKey) {
            return false;
        }

        this.previousKey = state.previousNode != null ? state.previousNode.key : null;
        if (this.previousKey != null) {
            if (this.previousKey !== this.currentKey) {
                let previousMesh: THREE.Mesh = state.previousNode.pano ?
                    this.createImageSphere(this.previousKey, state.previousTransform, state.previousNode) :
                    this.createImagePlane(this.previousKey, state.previousTransform, state.previousNode);

                this.imagePlaneScene.updateImagePlanes([previousMesh]);
            }
        }

        this.currentKey = state.currentNode.key;
        let currentMesh: THREE.Mesh = state.currentNode.pano ?
            this.createImageSphere(this.currentKey, state.currentTransform, state.currentNode) :
            this.createImagePlane(this.currentKey, state.currentTransform, state.currentNode);

        this.imagePlaneScene.updateImagePlanes([currentMesh]);

        this.alphaOld = 1;

        return true;
    }

    private render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {
        let planeAlpha: number = this.imagePlaneScene.imagePlanesOld.length ? 1 : this.alpha;

        for (let plane of this.imagePlaneScene.imagePlanes) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = planeAlpha;
        }

        for (let plane of this.imagePlaneScene.imagePlanesOld) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = this.alphaOld;
        }

        renderer.render(this.imagePlaneScene.scene, perspectiveCamera);
        renderer.render(this.imagePlaneScene.sceneOld, perspectiveCamera);

        for (let plane of this.imagePlaneScene.imagePlanes) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = this.alpha;
        }

        renderer.render(this.imagePlaneScene.scene, perspectiveCamera);
    }

    private createImagePlane(key: string, transform: Transform, node: Node): THREE.Mesh {
        let texture: THREE.Texture = this.createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters = this.createMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);
        let geometry: THREE.Geometry = this.getImagePlaneGeo(transform, node);
        let mesh: THREE.Mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }

    private createImageSphere(key: string, transform: Transform, node: Node): THREE.Mesh {
        let texture: THREE.Texture = this.createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters = this.createSphereMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);
        let geometry: THREE.Geometry = this.getImageSphereGeo(transform, node);
        let mesh: THREE.Mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }

    private createSphereMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let gpano: IGPano = transform.gpano;
        let phiLength: number = 2 * Math.PI * gpano.CroppedAreaImageWidthPixels / gpano.FullPanoWidthPixels;
        let thetaLength: number = Math.PI * gpano.CroppedAreaImageHeightPixels / gpano.FullPanoHeightPixels;

        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.equirectangular.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                opacity: {
                    type: "f",
                    value: 1,
                },
                phiLength: {
                    type: "f",
                    value: phiLength,
                },
                projectorMat: {
                    type: "m4",
                    value: transform.rt,
                },
                projectorTex: {
                    type: "t",
                    value: texture,
                },
                thetaLength: {
                    type: "f",
                    value: thetaLength,
                },
            },
            vertexShader: Shaders.equirectangular.vertex,
        };

        return materialParameters;
    }

    private createMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
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
                    value: texture,
                },
            },
            vertexShader: Shaders.perspective.vertex,
        };

        return materialParameters;
    }

    private createTexture(image: HTMLImageElement): THREE.Texture {
        let texture: THREE.Texture = new THREE.Texture(image);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        return texture;
    }

    private getImagePlaneGeo(transform: Transform, node: Node): THREE.Geometry {
        if (!node.mesh.populated ||
            transform.scale < 1e-2 ||
            transform.scale > 50) {
            return this.getFlatImagePlaneGeo(transform);
        }

        let geometry: THREE.Geometry = new THREE.Geometry();
        let t: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this.imagePlaneDepth * transform.scale;
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

    private getImageSphereGeo(transform: Transform, node: Node): THREE.Geometry {
        if (!node.mesh.populated ||
            transform.scale < 1e-2 ||
            transform.scale > 50) {
            return this.getFlatImageSphereGeo(transform);
        }

        let geometry: THREE.Geometry = new THREE.Geometry();
        let t: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this.imageSphereRadius * transform.scale;
        for (let v of node.mesh.vertices) {
            let l: number = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            let z: number = Math.max(minZ, Math.min(l, maxZ));
            let factor: number = z / l;
            let p: THREE.Vector3 = new THREE.Vector3(v[0] * factor, v[1] * factor, v[2] * factor);
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
        let tl: THREE.Vector3 = transform.pixelToVertex(-dx, -dy, this.imagePlaneDepth);
        let tr: THREE.Vector3 = transform.pixelToVertex( dx, -dy, this.imagePlaneDepth);
        let br: THREE.Vector3 = transform.pixelToVertex( dx, dy, this.imagePlaneDepth);
        let bl: THREE.Vector3 = transform.pixelToVertex(-dx, dy, this.imagePlaneDepth);

        let geometry: THREE.Geometry = new THREE.Geometry();

        geometry.vertices.push(tl, bl, br, tr);
        geometry.faces.push(new THREE.Face3(0, 1, 3), new THREE.Face3(1, 2, 3));

        return geometry;
    }

    private getFlatImageSphereGeo(transform: Transform): THREE.Geometry {
        let gpano: IGPano = transform.gpano;
        let phiStart: number = 2 * Math.PI * gpano.CroppedAreaLeftPixels / gpano.FullPanoWidthPixels;
        let phiLength: number = 2 * Math.PI * gpano.CroppedAreaImageWidthPixels / gpano.FullPanoWidthPixels;
        let thetaStart: number = Math.PI * gpano.CroppedAreaTopPixels / gpano.FullPanoHeightPixels;
        let thetaLength: number = Math.PI * gpano.CroppedAreaImageHeightPixels / gpano.FullPanoHeightPixels;
        let geometry: THREE.SphereGeometry = new THREE.SphereGeometry(
            this.imageSphereRadius,
            20,
            40,
            phiStart - Math.PI / 2,
            phiLength,
            thetaStart,
            thetaLength
        );

        geometry.applyMatrix(new THREE.Matrix4().getInverse(transform.rt));

        return geometry;
    }
}

UIService.register(GLUI);
export default GLUI;
