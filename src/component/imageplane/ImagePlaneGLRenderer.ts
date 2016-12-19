/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Subscription} from "rxjs/Subscription";

import {
    ImagePlaneScene,
    ImagePlaneFactory,
} from "../../Component";
import {Camera} from "../../Geo";
import {Node} from "../../Graph";
import {
    ICurrentState,
    IFrame,
} from "../../State";
import {TextureProvider} from "../../Tiles";

export class ImagePlaneGLRenderer {
    private _imagePlaneFactory: ImagePlaneFactory;
    private _imagePlaneScene: ImagePlaneScene;

    private _alpha: number;
    private _alphaOld: number;
    private _fadeOutSpeed: number;
    private _lastCamera: Camera;
    private _epsilon: number;

    private _currentKey: string;
    private _previousKey: string;
    private _providerDisposers: { [key: string]: () => void };

    private _frameId: number;
    private _needsRender: boolean;

    constructor() {
        this._imagePlaneFactory = new ImagePlaneFactory();
        this._imagePlaneScene = new ImagePlaneScene();

        this._alpha = 0;
        this._alphaOld = 0;
        this._fadeOutSpeed = 0.05;
        this._lastCamera = new Camera();
        this._epsilon = 0.000001;

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

    public updateFrame(frame: IFrame): void {
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

    public _updateTexture(texture: THREE.Texture): void {
        this._needsRender = true;

        for (let plane of this._imagePlaneScene.imagePlanes) {
            let material: THREE.ShaderMaterial = <THREE.ShaderMaterial>plane.material;

            let oldTexture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;
            material.uniforms.projectorTex.value = null;
            oldTexture.dispose();

            material.uniforms.projectorTex.value = texture;
        }
    }

    public updateTextureImage(image: HTMLImageElement, node?: Node): void {
        if (this._currentKey !== node.key) {
            return;
        }

        this._needsRender = true;

        for (let plane of this._imagePlaneScene.imagePlanes) {
            let material: THREE.ShaderMaterial = <THREE.ShaderMaterial>plane.material;
            let texture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;

            texture.image = image;
            texture.needsUpdate = true;
        }
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {
        let ts: number = window.performance.now();

        let planeAlpha: number = this._imagePlaneScene.imagePlanesOld.length ? 1 : this._alpha;

        for (let plane of this._imagePlaneScene.imagePlanes) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = planeAlpha;
        }

        for (let plane of this._imagePlaneScene.imagePlanesOld) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = this._alphaOld;
        }

        renderer.render(this._imagePlaneScene.scene, perspectiveCamera);
        renderer.render(this._imagePlaneScene.sceneOld, perspectiveCamera);

        for (let plane of this._imagePlaneScene.imagePlanes) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = this._alpha;
        }

        renderer.render(this._imagePlaneScene.scene, perspectiveCamera);

        let te: number = window.performance.now();
        if (te - ts > 10) {
            console.warn("Render image planes", (te - ts).toFixed(2));
        }
    }

    public clearNeedsRender(): void {
        this._needsRender = false;
    }

    public dispose(): void {
        this._imagePlaneScene.clear();
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

    private _updateImagePlanes(state: ICurrentState): boolean {
        if (state.currentNode == null || state.currentNode.key === this._currentKey) {
            return false;
        }

        let previousKey: string = state.previousNode != null ? state.previousNode.key : null;
        let currentKey: string = state.currentNode.key;

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
                    this._imagePlaneFactory.createMesh(state.previousNode, state.previousTransform);

                this._imagePlaneScene.updateImagePlanes([previousMesh]);
            }

            this._previousKey = previousKey;
        }

        this._currentKey = currentKey;
        let currentMesh: THREE.Mesh =
            this._imagePlaneFactory.createMesh(state.currentNode, state.currentTransform);

        this._imagePlaneScene.updateImagePlanes([currentMesh]);

        this._alphaOld = 1;

        return true;
    }
}

export default ImagePlaneGLRenderer;
