import * as THREE from "three";
import { Subscription } from "rxjs";

import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { Image } from "../../graph/Image";
import { Transform } from "../../geo/Transform";
import { TextureProvider } from "../../tile/TextureProvider";
import { MeshFactory } from "../util/MeshFactory";
import { MeshScene, MeshSceneItem } from "../util/MeshScene";
import { ProjectorShaderMaterial } from "./interfaces/ProjectorShaderMaterial";
import { GLShader } from "../../shader/Shader";
import { resolveShader } from "../../shader/Resolver";

export class ImageGLRenderer {
    private _factory: MeshFactory;
    private _scene: MeshScene;

    private _alpha: number;
    private _alphaOld: number;
    private _fadeOutSpeed: number;

    private _currentKey: string;
    private _previousKey: string;
    private _providerDisposers: { [key: string]: () => void; };

    private _frameId: number;
    private _needsRender: boolean;

    constructor() {
        this._factory = new MeshFactory();
        this._scene = new MeshScene();

        this._alpha = 0;
        this._alphaOld = 0;
        this._fadeOutSpeed = 0.05;

        this._currentKey = null;
        this._previousKey = null;
        this._providerDisposers = {};

        this._frameId = 0;
        this._needsRender = false;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public indicateNeedsRender(): void {
        this._needsRender = true;
    }

    public addPeripheryPlane(
        image: Image,
        transform: Transform,
        shader: GLShader): void {

        const mesh = this._factory.createMesh(image, transform, shader);
        const plane: MeshSceneItem = {
            mesh,
            imageId: image.id,
            camera: image.camera,
        };
        this._scene.addPeripheryPlanes([plane]);

        this._needsRender = true;
    }

    public clearPeripheryPlanes(): void {
        this._scene.setPeripheryPlanes([]);

        this._needsRender = true;
    }

    public setShader(shader: GLShader): void {
        const planes = [
            ...this._scene.planes,
            ...this._scene.planesOld,
            ...this._scene.planesPeriphery,
        ];
        this._setShader(shader, planes);
        this._needsRender = true;
    }

    public updateFrame(frame: AnimationFrame, shader: GLShader): void {
        this._updateFrameId(frame.id);
        this._needsRender = this._updateAlpha(frame.state.alpha) || this._needsRender;
        this._needsRender = this._updateAlphaOld(frame.state.alpha) || this._needsRender;
        this._needsRender = this._updateImagePlanes(frame.state, shader) || this._needsRender;
    }

    public setTextureProvider(key: string, provider: TextureProvider): void {
        if (key !== this._currentKey) {
            return;
        }

        const createdSubscription: Subscription = provider.textureCreated$
            .subscribe(
                (texture: THREE.Texture): void => {
                    this._updateTexture(texture);
                });

        const updatedSubscription: Subscription = provider.textureUpdated$
            .subscribe(
                (updated: boolean): void => {
                    this._needsRender = true;
                });

        const dispose: () => void = (): void => {
            createdSubscription.unsubscribe();
            updatedSubscription.unsubscribe();
            provider.dispose();
        };

        if (key in this._providerDisposers) {
            const disposeProvider: () => void = this._providerDisposers[key];
            disposeProvider();

            delete this._providerDisposers[key];
        }

        this._providerDisposers[key] = dispose;
    }

    public updateTextureImage(
        imageElement: HTMLImageElement,
        image: Image)
        : void {
        this._needsRender = true;

        const planes = [
            ...this._scene.planes,
            ...this._scene.planesOld,
            ...this._scene.planesPeriphery,
        ];

        for (const plane of planes) {
            if (plane.imageId !== image.id) {
                continue;
            }

            const material = <ProjectorShaderMaterial>plane.mesh.material;
            const texture = <THREE.Texture>material.uniforms.map.value;

            texture.image = imageElement;
            texture.needsUpdate = true;
        }
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        const planes = this._scene.planes;
        const planesOld = this._scene.planesOld;
        const planesPeriphery = this._scene.planesPeriphery;

        const planeAlpha: number = Object.keys(planesOld).length ? 1 : this._alpha;
        const peripheryAlpha: number = Object.keys(planesOld).length ? 1 : Math.floor(this._alpha);

        for (const plane of planes) {
            (<ProjectorShaderMaterial>plane.mesh.material).uniforms.opacity.value = planeAlpha;
        }

        for (const plane of planesOld) {
            (<ProjectorShaderMaterial>plane.mesh.material).uniforms.opacity.value = this._alphaOld;
        }

        for (const plane of planesPeriphery) {
            (<ProjectorShaderMaterial>plane.mesh.material).uniforms.opacity.value = peripheryAlpha;
        }

        renderer.render(this._scene.scenePeriphery, perspectiveCamera);
        renderer.render(this._scene.scene, perspectiveCamera);
        renderer.render(this._scene.sceneOld, perspectiveCamera);

        for (const plane of planes) {
            (<ProjectorShaderMaterial>plane.mesh.material).uniforms.opacity.value = this._alpha;
        }

        renderer.render(this._scene.scene, perspectiveCamera);
    }

    public clearNeedsRender(): void {
        this._needsRender = false;
    }

    public reset(): void {
        this._scene.clear();

        for (const disposeProvider of Object.values(this._providerDisposers)) {
            disposeProvider();
        }

        this._needsRender = true;
    }

    private _setShader(shader: GLShader, planes: MeshSceneItem[]): void {
        for (const plane of planes) {
            const material = <ProjectorShaderMaterial>plane.mesh.material;
            material.fragmentShader = resolveShader(
                shader.fragment,
                plane.camera);
            material.vertexShader = resolveShader(
                shader.vertex,
                plane.camera);
        }
    }

    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }

    private _updateAlpha(alpha: number): boolean {
        if (alpha === this._alpha) {
            return false;
        }

        this._alpha = alpha;

        return true;
    }

    private _updateAlphaOld(alpha: number): boolean {
        if (alpha < 1 || this._alphaOld === 0) {
            return false;
        }

        this._alphaOld = Math.max(0, this._alphaOld - this._fadeOutSpeed);

        return true;
    }

    private _updateImagePlanes(state: IAnimationState, shader: GLShader): boolean {
        if (state.currentImage == null ||
            state.currentImage.id === this._currentKey) {
            return false;
        }

        const previousKey: string = state.previousImage != null ? state.previousImage.id : null;
        const currentKey: string = state.currentImage.id;

        if (this._previousKey !== previousKey &&
            this._previousKey !== currentKey &&
            this._previousKey in this._providerDisposers) {

            const disposeProvider: () => void = this._providerDisposers[this._previousKey];
            disposeProvider();

            delete this._providerDisposers[this._previousKey];
        }

        if (previousKey != null) {
            if (previousKey !== this._currentKey && previousKey !== this._previousKey) {
                const previousMesh =
                    this._factory.createMesh(
                        state.previousImage,
                        state.previousTransform,
                        shader);

                const previousPlane: MeshSceneItem = {
                    mesh: previousMesh,
                    imageId: previousKey,
                    camera: state.previousImage.camera,
                };
                this._scene.updateImagePlanes([previousPlane]);
            }

            this._previousKey = previousKey;
        }

        this._currentKey = currentKey;
        const currentMesh =
            this._factory.createMesh(
                state.currentImage,
                state.currentTransform,
                shader);

        const plane: MeshSceneItem = {
            mesh: currentMesh,
            imageId: currentKey,
            camera: state.currentImage.camera,
        };
        this._scene.updateImagePlanes([plane]);

        this._alphaOld = 1;

        return true;
    }

    private _updateTexture(texture: THREE.Texture): void {
        this._needsRender = true;

        const planes = this._scene.planes;
        for (const plane of planes) {

            const material = <ProjectorShaderMaterial>plane.mesh.material;

            const oldTexture = <THREE.Texture>material.uniforms.map.value;
            material.uniforms.map.value = null;
            oldTexture.dispose();

            material.uniforms.map.value = texture;
        }
    }
}
