import * as THREE from "three";
import { Subscription } from "rxjs";
import { Spatial } from "../../geo/Spatial";
import { Image } from "../../graph/Image";
import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { TextureProvider } from "../../tile/TextureProvider";
import { SliderBBoxProjectorShaderMaterial } from "./interfaces/SliderBBoxProjectorShaderMaterial";
import { SliderConfigurationMode } from "../interfaces/SliderConfiguration";
import { SliderMeshFactory } from "./SliderMeshFactory";
import { isSpherical } from "../../geo/Geo";
import { CameraType } from "../../geo/interfaces/CameraType";
import { Camera } from "../../geo/Camera";
import { SliderTransform } from "./SliderTransform";
import { SliderMeshScene, SliderMeshSceneItem } from "./SliderMeshScene";
export class SliderGLRenderer {
    private _factory: SliderMeshFactory;
    private _scene: SliderMeshScene;
    private _spatial: Spatial;
    private _currentKey: string;
    private _previousKey: string;
    private _disabled: boolean;
    private _curtain: number;
    private _frameId: number;
    private _needsRender: boolean;
    private _mode: SliderConfigurationMode;
    private _gravityAligned: boolean;
    private _currentPerspective: THREE.PerspectiveCamera;
    private _previousCamera: Camera;
    private _previousPerspective: THREE.PerspectiveCamera;
    private _currentProviderDisposers: { [key: string]: () => void };
    private _previousProviderDisposers: { [key: string]: () => void };
    constructor() {
        this._factory = new SliderMeshFactory();
        this._scene = new SliderMeshScene();
        this._spatial = new Spatial();
        this._currentKey = null;
        this._previousKey = null;
        this._disabled = false;
        this._curtain = 1;
        this._frameId = 0;
        this._needsRender = false;
        this._mode = null;
        this._gravityAligned = false;
        this._currentPerspective = null;
        this._previousCamera = null;
        this._previousPerspective = null;
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
    public update(
        frame: AnimationFrame,
        mode: SliderConfigurationMode,
        gravityAligned: boolean = false): void {
        this._updateFrameId(frame.id);
        this._updateImagePlanes(frame.state, mode, gravityAligned);
    }
    public updateCurtain(curtain: number): void {
        if (this._curtain === curtain) {
            return;
        }
        this._curtain = curtain;
        this._updateCurtain();
        this._needsRender = true;
    }
    public updateTexture(
        imageElement: HTMLImageElement,
        image: Image)
        : void {
        const planes: SliderMeshSceneItem[] =
            image.id === this._currentKey ?
                this._scene.planes :
                image.id === this._previousKey ?
                    this._scene.planesOld :
                    [];
        if (planes.length) {
            return;
        }
        this._needsRender = true;
        for (const plane of planes) {
            let material: SliderBBoxProjectorShaderMaterial = <SliderBBoxProjectorShaderMaterial>plane.mesh.material;
            let texture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;
            texture.image = imageElement;
            texture.needsUpdate = true;
        }
    }
    public updateTextureImage(
        imageElement: HTMLImageElement,
        image?: Image)
        : void {
        if (this._currentKey !== image.id) {
            return;
        }
        this._needsRender = true;
        const planes: SliderMeshSceneItem[] = this._scene.planes;
        for (const plane of planes) {
            let material: SliderBBoxProjectorShaderMaterial = <SliderBBoxProjectorShaderMaterial>plane.mesh.material;
            let texture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;
            texture.image = imageElement;
            texture.needsUpdate = true;
        }
    }
    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {
        if (!this.disabled) {
            renderer.render(
                this._scene.sceneOld,
                this._getPreviousPerspective(perspectiveCamera));
        }
        renderer.render(
            this._scene.scene,
            this._getCurrentPerspective(perspectiveCamera));
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
    private _getCurrentPerspective(
        perspectiveCamera: THREE.PerspectiveCamera)
        : THREE.PerspectiveCamera {
        if (!this._gravityAligned) {
            return perspectiveCamera;
        }
        if (this._currentPerspective == null) {
            this._currentPerspective = perspectiveCamera.clone();
        } else {
            this._currentPerspective.copy(perspectiveCamera);
        }
        const direction = perspectiveCamera.getWorldDirection(
            new THREE.Vector3());
        this._currentPerspective.up.set(0, 0, 1);
        this._currentPerspective.matrixAutoUpdate = true;
        this._currentPerspective.lookAt(
            this._currentPerspective.position.clone().add(direction));
        this._currentPerspective.matrixAutoUpdate = false;
        this._currentPerspective.updateMatrix();
        this._currentPerspective.updateMatrixWorld(false);

        return this._currentPerspective;
    }
    private _getPreviousPerspective(
        perspectiveCamera: THREE.PerspectiveCamera)
        : THREE.PerspectiveCamera {
        if (this._mode === SliderConfigurationMode.Motion) {
            return this._getCurrentPerspective(perspectiveCamera);
        }
        if (this._previousCamera == null) {
            return perspectiveCamera;
        }
        if (this._previousPerspective == null) {
            this._previousPerspective = perspectiveCamera.clone();
            this._previousPerspective.position.copy(
                this._previousCamera.position);
            this._previousPerspective.up.copy(this._previousCamera.up);
            this._previousPerspective.matrixAutoUpdate = true;
            this._previousPerspective.lookAt(this._previousCamera.lookat);
            this._previousPerspective.matrixAutoUpdate = false;
            this._previousPerspective.updateMatrix();
            this._previousPerspective.updateMatrixWorld(false);
        }

        return this._previousPerspective;
    }
    private _setDisabled(state: IAnimationState): void {
        this._disabled = state.currentImage == null ||
            state.previousImage == null ||
            (isSpherical(state.currentImage.cameraType) &&
                !isSpherical(state.previousImage.cameraType));
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
        const planes: SliderMeshSceneItem[] = this._scene.planes;
        for (const plane of planes) {
            let shaderMaterial = <SliderBBoxProjectorShaderMaterial>plane.mesh.material;
            if (!!shaderMaterial.uniforms.curtain) {
                shaderMaterial.uniforms.curtain.value = this._curtain;
            }
        }
    }
    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }
    private _updateImagePlanes(
        state: IAnimationState,
        mode: SliderConfigurationMode,
        gravityAligned: boolean): void {
        const currentChanged: boolean = state.currentImage != null && this._currentKey !== state.currentImage.id;
        const previousChanged: boolean = state.previousImage != null && this._previousKey !== state.previousImage.id;
        const modeChanged: boolean = this._mode !== mode;
        const gravityAlignmentChanged: boolean =
            this._gravityAligned !== gravityAligned;
        if (!(currentChanged || previousChanged || modeChanged ||
            gravityAlignmentChanged)) {
            return;
        }
        this._setDisabled(state);
        this._needsRender = true;
        this._mode = mode;
        this._gravityAligned = gravityAligned;
        this._previousCamera = state.previousCamera == null ? null :
            gravityAligned ? new Camera(state.previousTransform) :
                state.previousCamera.clone();
        if (gravityAligned && this._previousCamera != null) {
            this._previousCamera.up.set(0, 0, 1);
        }
        this._previousPerspective = null;
        const motionless =
            state.motionless ||
            mode === SliderConfigurationMode.Stationary ||
            isSpherical(state.currentImage.cameraType);
        if (this.disabled || previousChanged) {
            if (this._previousKey in this._previousProviderDisposers) {
                this._previousProviderDisposers[this._previousKey]();
                delete this._previousProviderDisposers[this._previousKey];
            }
        }
        if (this.disabled) {
            this._scene.setImagePlanesOld([]);
        } else {
            if (previousChanged || modeChanged || gravityAlignmentChanged) {
                const previousNode: Image = state.previousImage;
                this._previousKey = previousNode.id;
                const elements: number[] = state.currentTransform.rt.elements;
                let translation: number[] = [elements[12], elements[13], elements[14]];
                const currentAspect: number = state.currentTransform.basicAspect;
                const previousAspect: number = state.previousTransform.basicAspect;
                const textureScale: number[] = currentAspect > previousAspect ?
                    [1, previousAspect / currentAspect] :
                    [currentAspect / previousAspect, 1];
                let rotation: number[] = state.currentImage.rotation;
                let width: number = state.currentImage.width;
                let height: number = state.currentImage.height;
                if (isSpherical(previousNode.cameraType)) {
                    rotation = state.previousImage.rotation;
                    translation = this._spatial
                        .rotate(
                            this._spatial
                                .opticalCenter(
                                    state.currentImage.rotation,
                                    translation)
                                .toArray(),
                            rotation)
                        .multiplyScalar(-1)
                        .toArray();
                    width = state.previousImage.width;
                    height = state.previousImage.height;
                }
                const transform: SliderTransform = new SliderTransform(
                    state.currentImage.exifOrientation,
                    width,
                    height,
                    state.currentImage.scale,
                    rotation,
                    translation,
                    previousNode.image,
                    textureScale,
                    Object.values(state.currentImage.camera.parameters),
                    <CameraType>state.currentImage.camera.type);

                const pElements: number[] = state.previousTransform.rt.elements;
                let pTranslation: number[] = [pElements[12], pElements[13], pElements[14]];
                const previousTransform = new SliderTransform(
                    state.previousImage.exifOrientation,
                    state.previousImage.width,
                    state.previousImage.height,
                    state.previousImage.scale,
                    state.previousImage.rotation,
                    pTranslation,
                    previousNode.image,
                    undefined,
                    Object.values(state.previousImage.camera.parameters),
                    <CameraType>state.previousImage.camera.type);

                const cElements: number[] = state.currentTransform.rt.elements;
                let cTranslation: number[] = [cElements[12], cElements[13], cElements[14]];
                const currentTransform = new SliderTransform(
                    state.currentImage.exifOrientation,
                    state.currentImage.width,
                    state.currentImage.height,
                    state.currentImage.scale,
                    state.currentImage.rotation,
                    cTranslation,
                    state.currentImage.image,
                    undefined,
                    Object.values(state.currentImage.camera.parameters),
                    <CameraType>state.currentImage.camera.type);

                let mesh: THREE.Mesh = undefined;
                if (isSpherical(previousNode.cameraType)) {
                    mesh = this._factory.createMesh(
                        previousNode,
                        motionless ||
                            isSpherical(state.currentImage.camera.type) ?
                            transform : previousTransform);
                } else {
                    if (motionless) {
                        mesh = this._factory.createMesh(
                            state.previousImage,
                            previousTransform,
                            false);
                    } else {
                        mesh = this._factory.createMesh(state.previousImage, previousTransform);
                    }
                }
                const previousPlanes: SliderMeshSceneItem[] = [{imageId: previousNode.id, mesh, camera: state.previousImage.camera}];
                this._scene.setImagePlanesOld(previousPlanes);
            }
        }
        if (currentChanged || modeChanged || gravityAlignmentChanged) {
            if (this._currentKey in this._currentProviderDisposers) {
                this._currentProviderDisposers[this._currentKey]();
                delete this._currentProviderDisposers[this._currentKey];
            }

            const cElements: number[] = state.currentTransform.rt.elements;
            let cTranslation: number[] = [cElements[12], cElements[13], cElements[14]];
            const currentTransform = new SliderTransform(
                state.currentImage.exifOrientation,
                state.currentImage.width,
                state.currentImage.height,
                state.currentImage.scale,
                state.currentImage.rotation,
                cTranslation,
                state.currentImage.image,
                undefined,
                Object.values(state.currentImage.camera.parameters),
                <CameraType>state.currentImage.camera.type);

            this._currentKey = state.currentImage.id;
            const planes: SliderMeshSceneItem[] = [];
            if (isSpherical(state.currentImage.cameraType)) {
                planes.push(
                    {imageId: state.currentImage.id, mesh: this._factory.createCurtainMesh(
                        state.currentImage,
                        currentTransform), camera: state.currentImage.camera}
                );
            } else {
                if (motionless) {
                    planes.push(
                        {imageId: state.currentImage.id, mesh: this._factory.createCurtainMesh(
                            state.currentImage,
                            currentTransform,
                            false), camera: state.currentImage.camera}
                    );
                } else {
                    planes.push(
                        {imageId: state.currentImage.id, mesh: this._factory.createCurtainMesh(
                            state.currentImage,
                            currentTransform), camera: state.currentImage.camera}
                    );
                }
            }
            this._scene.setImagePlanes(planes);
            this._updateCurtain();
        }
    }
    private _updateTexture(texture: THREE.Texture): void {
        this._needsRender = true;
        const planes: SliderMeshSceneItem[] = this._scene.planes;
        for (const plane of planes) {
            let material: SliderBBoxProjectorShaderMaterial = <SliderBBoxProjectorShaderMaterial>plane.mesh.material;
            let oldTexture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;
            material.uniforms.projectorTex.value = null;
            oldTexture.dispose();
            material.uniforms.projectorTex.value = texture;
        }
    }
    private _updateTexturePrev(texture: THREE.Texture): void {
        this._needsRender = true;
        const planes: SliderMeshSceneItem[] = this._scene.planesOld;
        for (const plane of planes) {
            let material: SliderBBoxProjectorShaderMaterial = <SliderBBoxProjectorShaderMaterial>plane.mesh.material;
            let oldTexture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;
            material.uniforms.projectorTex.value = null;
            oldTexture.dispose();
            material.uniforms.projectorTex.value = texture;
        }
    }
}
