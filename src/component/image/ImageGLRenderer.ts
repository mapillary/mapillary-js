import * as THREE from "three";
import { Subscription } from "rxjs";

import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { Image } from "../../graph/Image";
import { Transform } from "../../geo/Transform";
import { TextureProvider } from "../../tile/TextureProvider";
import { MeshFactory } from "../util/MeshFactory";
import { MeshScene } from "../util/MeshScene";
import { ProjectorShaderMaterial } from "./interfaces/ProjectorShaderMaterial";

export class ImageGLRenderer {
    private _factory: MeshFactory;
    private _scene: MeshScene;

    private _alpha: number;
    private _alphaOld: number;
    private _fadeOutSpeed: number;

    private _currentKey: string;
    private _previousKey: string;
    private _providerDisposers: { [key: string]: () => void };

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

    public addPeripheryPlane(image: Image, transform: Transform): void {
        const mesh: THREE.Mesh = this._factory.createMesh(image, transform);
        const planes: { [key: string]: THREE.Mesh } = {};
        planes[image.id] = mesh;
        this._scene.addPeripheryPlanes(planes);

        this._needsRender = true;
    }

    public clearPeripheryPlanes(): void {
        this._scene.setPeripheryPlanes({});

        this._needsRender = true;
    }

    public updateFrame(frame: AnimationFrame): void {
        this._updateFrameId(frame.id);
        this._needsRender = this._updateAlpha(frame.state.alpha) || this._needsRender;
        this._needsRender = this._updateAlphaOld(frame.state.alpha) || this._needsRender;
        this._needsRender = this._updateImagePlanes(frame.state) || this._needsRender;
    }

    public setTextureProvider(key: string, provider: TextureProvider): void {
        if (key !== this._currentKey) {
            return;
        }

        let createdSubscription: Subscription = provider.textureCreated$
            .subscribe(
                (texture: THREE.Texture): void => {
                    this._updateTexture(texture);
                });

        let updatedSubscription: Subscription = provider.textureUpdated$
            .subscribe(
                (updated: boolean): void => {
                    this._needsRender = true;
                });

        let dispose: () => void = (): void => {
            createdSubscription.unsubscribe();
            updatedSubscription.unsubscribe();
            provider.dispose();
        };

        if (key in this._providerDisposers) {
            let disposeProvider: () => void = this._providerDisposers[key];
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

        const planes: { [key: string]: THREE.Mesh } =
            this._extend({}, this._scene.planes, this._scene.planesOld, this._scene.planesPeriphery);

        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            if (key !== image.id) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];

            let material: ProjectorShaderMaterial = <ProjectorShaderMaterial>plane.material;
            let texture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;

            texture.image = imageElement;
            texture.needsUpdate = true;
        }
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        const planes: { [key: string]: THREE.Mesh } = this._scene.planes;
        const planesOld: { [key: string]: THREE.Mesh } = this._scene.planesOld;
        const planesPeriphery: { [key: string]: THREE.Mesh } = this._scene.planesPeriphery;

        const planeAlpha: number = Object.keys(planesOld).length ? 1 : this._alpha;
        const peripheryAlpha: number = Object.keys(planesOld).length ? 1 : Math.floor(this._alpha);

        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            (<ProjectorShaderMaterial>plane.material).uniforms.opacity.value = planeAlpha;
        }

        for (const key in planesOld) {
            if (!planesOld.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planesOld[key];
            (<ProjectorShaderMaterial>plane.material).uniforms.opacity.value = this._alphaOld;
        }

        for (const key in planesPeriphery) {
            if (!planesPeriphery.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planesPeriphery[key];
            (<ProjectorShaderMaterial>plane.material).uniforms.opacity.value = peripheryAlpha;
        }

        renderer.render(this._scene.scenePeriphery, perspectiveCamera);
        renderer.render(this._scene.scene, perspectiveCamera);
        renderer.render(this._scene.sceneOld, perspectiveCamera);

        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            (<ProjectorShaderMaterial>plane.material).uniforms.opacity.value = this._alpha;
        }

        renderer.render(this._scene.scene, perspectiveCamera);
    }

    public clearNeedsRender(): void {
        this._needsRender = false;
    }

    public dispose(): void {
        this._scene.clear();
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

    private _updateImagePlanes(state: IAnimationState): boolean {
        if (state.currentImage == null ||
            state.currentImage.id === this._currentKey) {
            return false;
        }

        let previousKey: string = state.previousImage != null ? state.previousImage.id : null;
        let currentKey: string = state.currentImage.id;

        if (this._previousKey !== previousKey &&
            this._previousKey !== currentKey &&
            this._previousKey in this._providerDisposers) {

            let disposeProvider: () => void = this._providerDisposers[this._previousKey];
            disposeProvider();

            delete this._providerDisposers[this._previousKey];
        }

        if (previousKey != null) {
            if (previousKey !== this._currentKey && previousKey !== this._previousKey) {
                let previousMesh: THREE.Mesh =
                    this._factory.createMesh(state.previousImage, state.previousTransform);

                const previousPlanes: { [key: string]: THREE.Mesh } = {};
                previousPlanes[previousKey] = previousMesh;
                this._scene.updateImagePlanes(previousPlanes);
            }

            this._previousKey = previousKey;
        }

        this._currentKey = currentKey;
        let currentMesh =
            this._factory.createMesh(
                state.currentImage,
                state.currentTransform);

        const planes: { [key: string]: THREE.Mesh } = {};
        planes[currentKey] = currentMesh;
        this._scene.updateImagePlanes(planes);

        this._alphaOld = 1;

        return true;
    }

    private _updateTexture(texture: THREE.Texture): void {
        this._needsRender = true;

        const planes: { [key: string]: THREE.Mesh } = this._scene.planes;

        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            let material: ProjectorShaderMaterial = <ProjectorShaderMaterial>plane.material;

            let oldTexture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;
            material.uniforms.projectorTex.value = null;
            oldTexture.dispose();

            material.uniforms.projectorTex.value = texture;
        }
    }

    private _extend<T>(dest: T, ...sources: T[]): T {
        for (const src of sources) {
            for (const k in src) {
                if (!src.hasOwnProperty(k)) {
                    continue;
                }

                dest[k] = src[k];
            }
        }
        return dest;
    }
}
