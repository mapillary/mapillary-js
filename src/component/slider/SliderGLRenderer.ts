import * as THREE from "three";
import { Subscription } from "rxjs";

import { Spatial } from "../../geo/Spatial";
import { Transform } from "../../geo/Transform";
import { Node } from "../../graph/Node";
import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { TextureProvider } from "../../tiles/TextureProvider";
import { BBoxProjectorShaderMaterial } from "../imageplane/interfaces/BBoxProjectorShaderMaterial";
import { ProjectorShaderMaterial } from "../imageplane/interfaces/ProjectorShaderMaterial";
import { SliderConfigurationMode } from "../interfaces/SliderConfiguration";
import { MeshFactory } from "../utils/MeshFactory";
import { MeshScene } from "../utils/MeshScene";
import { isSpherical } from "../../geo/Geo";
import { CameraType } from "../../geo/interfaces/CameraType";

export class SliderGLRenderer {
    private _factory: MeshFactory;
    private _scene: MeshScene;
    private _spatial: Spatial;

    private _currentKey: string;
    private _previousKey: string;

    private _disabled: boolean;
    private _curtain: number;
    private _frameId: number;
    private _needsRender: boolean;

    private _mode: SliderConfigurationMode;

    private _currentProviderDisposers: { [key: string]: () => void };
    private _previousProviderDisposers: { [key: string]: () => void };

    constructor() {
        this._factory = new MeshFactory();
        this._scene = new MeshScene();
        this._spatial = new Spatial();

        this._currentKey = null;
        this._previousKey = null;

        this._disabled = false;
        this._curtain = 1;
        this._frameId = 0;
        this._needsRender = false;

        this._mode = null;

        this._currentProviderDisposers = {};
        this._previousProviderDisposers = {};
    }

    public get disabled(): boolean {
        return this._disabled;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public setTextureProvider(key: string, provider: TextureProvider): void {
        this._setTextureProvider(
            key,
            this._currentKey,
            provider,
            this._currentProviderDisposers,
            this._updateTexture.bind(this));
    }

    public setTextureProviderPrev(key: string, provider: TextureProvider): void {
        this._setTextureProvider(
            key,
            this._previousKey,
            provider,
            this._previousProviderDisposers,
            this._updateTexturePrev.bind(this));
    }

    public update(frame: AnimationFrame, mode: SliderConfigurationMode): void {
        this._updateFrameId(frame.id);
        this._updateImagePlanes(frame.state, mode);
    }

    public updateCurtain(curtain: number): void {
        if (this._curtain === curtain) {
            return;
        }

        this._curtain = curtain;
        this._updateCurtain();

        this._needsRender = true;
    }

    public updateTexture(image: HTMLImageElement, node: Node): void {
        const planes: { [key: string]: THREE.Mesh } = node.id === this._currentKey ?
            this._scene.planes :
            node.id === this._previousKey ?
                this._scene.planesOld :
                {};

        if (Object.keys(planes).length === 0) {
            return;
        }

        this._needsRender = true;

        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            let material: ProjectorShaderMaterial = <ProjectorShaderMaterial>plane.material;
            let texture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;

            texture.image = image;
            texture.needsUpdate = true;
        }
    }

    public updateTextureImage(image: HTMLImageElement, node?: Node): void {
        if (this._currentKey !== node.id) {
            return;
        }

        this._needsRender = true;

        const planes: { [key: string]: THREE.Mesh } = this._scene.planes;

        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            let material: ProjectorShaderMaterial = <ProjectorShaderMaterial>plane.material;
            let texture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;

            texture.image = image;
            texture.needsUpdate = true;
        }
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        if (!this.disabled) {
            renderer.render(this._scene.sceneOld, perspectiveCamera);
        }

        renderer.render(this._scene.scene, perspectiveCamera);

        this._needsRender = false;
    }

    public dispose(): void {
        this._scene.clear();

        for (const key in this._currentProviderDisposers) {
            if (!this._currentProviderDisposers.hasOwnProperty(key)) {
                continue;
            }

            this._currentProviderDisposers[key]();
        }

        for (const key in this._previousProviderDisposers) {
            if (!this._previousProviderDisposers.hasOwnProperty(key)) {
                continue;
            }

            this._previousProviderDisposers[key]();
        }

        this._currentProviderDisposers = {};
        this._previousProviderDisposers = {};
    }

    private _getBasicCorners(currentAspect: number, previousAspect: number): number[][] {
        let offsetX: number;
        let offsetY: number;

        if (currentAspect > previousAspect) {
            offsetX = 0.5;
            offsetY = 0.5 * currentAspect / previousAspect;
        } else {
            offsetX = 0.5 * previousAspect / currentAspect;
            offsetY = 0.5;
        }

        return [[0.5 - offsetX, 0.5 - offsetY], [0.5 + offsetX, 0.5 + offsetY]];
    }

    private _setDisabled(state: IAnimationState): void {
        this._disabled = state.currentNode == null ||
            state.previousNode == null ||
            (isSpherical(state.currentNode.cameraType) &&
                !isSpherical(state.previousNode.cameraType));
    }

    private _setTextureProvider(
        key: string,
        originalKey: string,
        provider: TextureProvider,
        providerDisposers: { [key: string]: () => void },
        updateTexture: (texture: THREE.Texture) => void): void {

        if (key !== originalKey) {
            return;
        }

        let createdSubscription: Subscription = provider.textureCreated$
            .subscribe(updateTexture);

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

        if (key in providerDisposers) {
            let disposeProvider: () => void = providerDisposers[key];
            disposeProvider();

            delete providerDisposers[key];
        }

        providerDisposers[key] = dispose;
    }

    private _updateCurtain(): void {
        const planes: { [key: string]: THREE.Mesh } = this._scene.planes;

        for (const key in planes) {
            if (!planes.hasOwnProperty(key)) {
                continue;
            }

            const plane: THREE.Mesh = planes[key];
            let shaderMaterial = <BBoxProjectorShaderMaterial>plane.material;

            if (!!shaderMaterial.uniforms.curtain) {
                shaderMaterial.uniforms.curtain.value = this._curtain;
            }
        }
    }

    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }

    private _updateImagePlanes(state: IAnimationState, mode: SliderConfigurationMode): void {
        const currentChanged: boolean = state.currentNode != null && this._currentKey !== state.currentNode.id;
        const previousChanged: boolean = state.previousNode != null && this._previousKey !== state.previousNode.id;
        const modeChanged: boolean = this._mode !== mode;

        if (!(currentChanged || previousChanged || modeChanged)) {
            return;
        }

        this._setDisabled(state);
        this._needsRender = true;
        this._mode = mode;

        const motionless =
            state.motionless ||
            mode === SliderConfigurationMode.Stationary ||
            isSpherical(state.currentNode.cameraType);

        if (this.disabled || previousChanged) {
            if (this._previousKey in this._previousProviderDisposers) {
                this._previousProviderDisposers[this._previousKey]();

                delete this._previousProviderDisposers[this._previousKey];
            }
        }

        if (this.disabled) {
            this._scene.setImagePlanesOld({});
        } else {
            if (previousChanged || modeChanged) {
                const previousNode: Node = state.previousNode;

                this._previousKey = previousNode.id;

                const elements: number[] = state.currentTransform.rt.elements;
                let translation: number[] = [elements[12], elements[13], elements[14]];

                const currentAspect: number = state.currentTransform.basicAspect;
                const previousAspect: number = state.previousTransform.basicAspect;

                const textureScale: number[] = currentAspect > previousAspect ?
                    [1, previousAspect / currentAspect] :
                    [currentAspect / previousAspect, 1];

                let rotation: number[] = state.currentNode.rotation;
                let width: number = state.currentNode.width;
                let height: number = state.currentNode.height;

                if (isSpherical(previousNode.cameraType)) {
                    rotation = state.previousNode.rotation;
                    translation = this._spatial
                        .rotate(
                            this._spatial
                                .opticalCenter(
                                    state.currentNode.rotation,
                                    translation)
                                .toArray(),
                            rotation)
                        .multiplyScalar(-1)
                        .toArray();

                    width = state.previousNode.width;
                    height = state.previousNode.height;
                }

                const transform: Transform = new Transform(
                    state.currentNode.orientation,
                    width,
                    height,
                    state.currentNode.scale,
                    rotation,
                    translation,
                    previousNode.image,
                    textureScale,
                    state.currentNode.cameraParameters,
                    <CameraType>state.currentNode.cameraType);

                let mesh: THREE.Mesh = undefined;

                if (isSpherical(previousNode.cameraType)) {
                    mesh = this._factory.createMesh(
                        previousNode,
                        motionless ||
                            isSpherical(state.currentNode.cameraType) ?
                            transform : state.previousTransform);
                } else {
                    if (motionless) {
                        const [[basicX0, basicY0], [basicX1, basicY1]]: number[][] = this._getBasicCorners(currentAspect, previousAspect);

                        mesh = this._factory.createFlatMesh(
                            state.previousNode,
                            transform,
                            basicX0,
                            basicX1,
                            basicY0,
                            basicY1);
                    } else {
                        mesh = this._factory.createMesh(state.previousNode, state.previousTransform);
                    }
                }

                const previousPlanes: { [key: string]: THREE.Mesh } = {};
                previousPlanes[previousNode.id] = mesh;
                this._scene.setImagePlanesOld(previousPlanes);
            }
        }

        if (currentChanged || modeChanged) {
            if (this._currentKey in this._currentProviderDisposers) {
                this._currentProviderDisposers[this._currentKey]();

                delete this._currentProviderDisposers[this._currentKey];
            }

            this._currentKey = state.currentNode.id;

            const planes: { [key: string]: THREE.Mesh } = {};

            if (isSpherical(state.currentNode.cameraType)) {
                planes[state.currentNode.id] =
                    this._factory.createCurtainMesh(
                        state.currentNode,
                        state.currentTransform);
            } else {
                if (motionless) {
                    planes[state.currentNode.id] = this._factory.createDistortedCurtainMesh(state.currentNode, state.currentTransform);
                } else {
                    planes[state.currentNode.id] = this._factory.createCurtainMesh(state.currentNode, state.currentTransform);
                }
            }

            this._scene.setImagePlanes(planes);

            this._updateCurtain();
        }
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

    private _updateTexturePrev(texture: THREE.Texture): void {
        this._needsRender = true;

        const planes: { [key: string]: THREE.Mesh } = this._scene.planesOld;

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
}
