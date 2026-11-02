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
import { Transform } from "../../geo/Transform";
import { SliderTransform } from "./SliderTransform";
import { SliderMeshScene, SliderMeshSceneItem } from "./SliderMeshScene";
import { canLevelSliderComparison, canLevelSliderImage } from "./SliderAlignment";
import { sliderHeadingRotation } from "./SliderHeading";
import { translatedSliderPerspective } from "./SliderAutomaticMotion";
import { sliderViewAlignedRoll } from "./SliderRoll";
import { sliderReconstructionImage, sliderPairKey, sliderCameraOrigin, sliderViewAlignedStationary } from "./SliderReconstruction";
export class SliderGLRenderer {
    private _factory: SliderMeshFactory;
    private _scene: SliderMeshScene;
    private _spatial: Spatial;
    private _currentKey: string;
    private _previousKey: string;
    private _disabled: boolean;
    private _curtain: number;
    private _screenSpace: boolean = false;
    private _frameId: number;
    private _needsRender: boolean;
    private _mode: SliderConfigurationMode;
    private _viewAligned: boolean = false;
    private _automaticMotion: boolean = false;
    private _motionOrigins: THREE.Vector3[] = [];
    private _viewAlignedPair: string;
    private _gravityAligned: boolean;
    private _currentGravityAligned: boolean;
    private _previousGravityAligned: boolean;
    private _previousSpherical: boolean;
    private _currentPerspective: THREE.PerspectiveCamera;
    private _currentCamera: Camera;
    private _previousCamera: Camera;
    private _currentNativeUp: THREE.Vector3;
    private _previousNativeUp: THREE.Vector3;
    private _previousLevelImage: { image: Image; transform: Transform } = null;
    private _previousLevelAspect: number = null;
    private _previousLevelResult: boolean = false;
    private _previousPerspective: THREE.PerspectiveCamera;
    private _previousRotation: THREE.Quaternion;
    private _headingRotation: THREE.Quaternion;
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
        this._currentGravityAligned = false;
        this._previousGravityAligned = false;
        this._previousSpherical = false;
        this._currentPerspective = null;
        this._currentCamera = null;
        this._previousCamera = null;
        this._previousPerspective = null;
        this._previousRotation = null;
        this._headingRotation = new THREE.Quaternion();
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
        gravityAligned: boolean = false,
        viewAligned: boolean = false,
        automaticMotion: boolean = false): void {
        this._updateFrameId(frame.id);
        try {
            this._updateImagePlanes(frame.state, mode, gravityAligned, viewAligned, automaticMotion);
        } catch (error) {
            if (!automaticMotion) { throw error; }
            // Corrupt/partially hydrated opt-in data is not a renderer crash.
            this._disabled = true;
            this._mode = SliderConfigurationMode.Stationary;
            this._scene.clear();
            this._needsRender = true;
        }
    }
    public updateCurtain(curtain: number, screenSpace: boolean = false): void {
        if (this._curtain === curtain && this._screenSpace === screenSpace) {
            return;
        }
        this._curtain = curtain;
        this._screenSpace = screenSpace;
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
        if (this._viewAligned &&
            this._mode === SliderConfigurationMode.Motion && this._motionOrigins.length === 2) {
            return translatedSliderPerspective(perspectiveCamera,
                this._motionOrigins[0], this._motionOrigins[1], this._curtain);
        }
        if (this._viewAligned || !this._currentGravityAligned) {
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
        if (this._viewAligned && this._previousCamera != null) {
            // Common-view ray reprojection: copy the live foreground frame,
            // never the native-relative rotation used by legacy comparisons.
            const current = this._getCurrentPerspective(perspectiveCamera);
            if (this._previousPerspective == null) {
                this._previousPerspective = current.clone();
            } else {
                this._previousPerspective.copy(current);
            }
            this._previousPerspective.position.copy(this._previousSpherical ||
                this._mode === SliderConfigurationMode.Motion ?
                current.position : this._previousCamera.position);
            // Keep the comparison's native frame upright like the original's,
            // not tilted by the two reconstructions' differing roll estimates.
            const roll = sliderViewAlignedRoll(current,
                this._currentNativeUp, this._previousNativeUp,
                this._previousViewAlignedLevel(current.aspect));
            if (this._mode === SliderConfigurationMode.Motion) {
                this._previousPerspective.matrixAutoUpdate = false;
                this._previousPerspective.matrix.copy(current.matrixWorld)
                    .setPosition(this._previousPerspective.position);
                if (roll !== 0) {
                    this._previousPerspective.matrix.multiply(
                        new THREE.Matrix4().makeRotationZ(roll));
                    this._previousPerspective.quaternion.setFromRotationMatrix(
                        new THREE.Matrix4().extractRotation(this._previousPerspective.matrix));
                }
            } else {
                if (roll !== 0) {
                    this._previousPerspective.quaternion.multiply(
                        new THREE.Quaternion().setFromAxisAngle(
                            new THREE.Vector3(0, 0, 1), roll));
                }
                this._previousPerspective.updateMatrix();
            }
            this._previousPerspective.updateMatrixWorld(false);
            return this._previousPerspective;
        }
        if (this._mode === SliderConfigurationMode.Motion &&
            (!this._gravityAligned ||
                this._currentGravityAligned && this._previousGravityAligned)) {
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
            // Panorama meshes are recentered on the foreground camera. Keep
            // the background's independent direction/up, not its GPS position.
            const lookat = this._previousCamera.lookat.clone();
            if (this._gravityAligned && this._previousSpherical) {
                const direction = lookat.clone().sub(this._previousCamera.position);
                this._previousPerspective.position.copy(perspectiveCamera.position);
                lookat.copy(perspectiveCamera.position).add(direction);
            }
            this._previousPerspective.lookAt(lookat);
            this._previousPerspective.matrixAutoUpdate = false;
            this._previousPerspective.updateMatrix();
            this._previousPerspective.updateMatrixWorld(false);
        }
        if (this._gravityAligned && this._currentCamera != null) {
            // Map the live view's native-relative rotation into the comparison's
            // upright frame. Do not freeze the fallback camera or share an
            // untrusted reconstructed world-up axis between the two images.
            if (this._previousRotation == null) {
                const currentRotation = this._getCameraQuaternion(this._currentCamera);
                this._previousRotation = this._getCameraQuaternion(this._previousCamera)
                    .multiply(this._headingRotation)
                    .multiply(currentRotation.invert());
            }
            const current = this._getCurrentPerspective(perspectiveCamera);
            this._previousPerspective.copy(current);
            this._previousPerspective.position.copy(this._previousSpherical ?
                current.position : this._previousCamera.position);
            this._previousPerspective.up.copy(this._previousCamera.up);
            this._previousPerspective.quaternion.copy(this._previousRotation)
                .multiply(current.quaternion);
            this._previousPerspective.updateMatrix();
            this._previousPerspective.updateMatrixWorld(false);
        }

        return this._previousPerspective;
    }
    /** Comparison levelling, as the ordinary viewer decides it for this viewport. */
    private _previousViewAlignedLevel(aspect: number): boolean {
        const level = this._previousLevelImage;
        if (level == null) {
            return false;
        }
        if (this._previousLevelAspect == null ||
            Math.abs(this._previousLevelAspect - aspect) > 1e-3) {
            this._previousLevelAspect = aspect;
            this._previousLevelResult = canLevelSliderComparison(level.image, level.transform, aspect);
        }
        return this._previousLevelResult;
    }
    private _getCameraQuaternion(camera: Camera): THREE.Quaternion {
        const matrix = new THREE.Matrix4().lookAt(
            camera.position, camera.lookat, camera.up);
        return new THREE.Quaternion().setFromRotationMatrix(matrix);
    }
    private _setDisabled(state: IAnimationState): void {
        this._disabled = state.currentImage == null ||
            state.previousImage == null ||
            (!this._viewAligned && isSpherical(state.currentImage.cameraType) &&
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
            if (shaderMaterial.uniforms.screenSpace) {
                shaderMaterial.uniforms.screenSpace.value = this._screenSpace;
            }
        }
    }
    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }
    private _updateImagePlanes(
        state: IAnimationState,
        mode: SliderConfigurationMode,
        gravityAligned: boolean,
        viewAligned: boolean = false,
        automaticMotion: boolean = false): void {
        if (viewAligned && (!state.currentImage || !state.currentTransform ||
            state.previousImage && !state.previousTransform ||
            !state.previousImage && this._previousKey != null)) {
            // Partial hydration must not terminate the shared GL subscription.
            // Retain textures/providers; invalidate the pair so the next
            // complete same-ID frame rebuilds without losing high-res imagery.
            this._disabled = true;
            this._mode = SliderConfigurationMode.Stationary;
            this._motionOrigins = [];
            this._viewAlignedPair = null;

            this._needsRender = true;
            return;
        }
        const pairKey = viewAligned ? sliderPairKey(state) : null;
        const pairChanged = viewAligned && pairKey !== this._viewAlignedPair;
        if (sliderViewAlignedStationary(state, viewAligned)) {
            mode = SliderConfigurationMode.Stationary;
        }
        const currentIdChanged = state.currentImage != null && this._currentKey !== state.currentImage.id;
        const previousIdChanged = state.previousImage != null && this._previousKey !== state.previousImage.id;
        const currentChanged: boolean = state.currentImage != null && (currentIdChanged || pairChanged);
        const previousChanged: boolean = state.previousImage != null && (previousIdChanged || pairChanged);
        const modeChanged: boolean = this._mode !== mode;
        const gravityAlignmentChanged: boolean =
            this._gravityAligned !== gravityAligned;
        const viewAlignmentChanged: boolean = this._viewAligned !== viewAligned;
        const automaticChanged = this._automaticMotion !== automaticMotion;
        if (!(currentChanged || previousChanged || modeChanged ||
            gravityAlignmentChanged || viewAlignmentChanged || automaticChanged)) {
            return;
        }
        this._viewAligned = viewAligned;
        this._automaticMotion = automaticMotion;
        this._viewAlignedPair = pairKey;
        this._motionOrigins = viewAligned && !state.motionless &&
            !sliderViewAlignedStationary(state, viewAligned) && state.previousTransform && state.currentTransform ?
            [state.previousTransform, state.currentTransform].map(sliderCameraOrigin) : [];
        this._setDisabled(state);
        this._needsRender = true;
        this._mode = mode;
        this._gravityAligned = gravityAligned;
        this._currentGravityAligned = gravityAligned &&
            state.currentImage != null &&
            canLevelSliderImage(state.currentImage, state.currentTransform);
        this._previousSpherical = state.previousImage != null &&
            isSpherical(state.previousImage.cameraType);
        this._previousGravityAligned = gravityAligned &&
            state.previousImage != null &&
            canLevelSliderImage(state.previousImage, state.previousTransform);
        // View-aligned comparisons follow the ordinary viewer's perspective
        // levelling decision, evaluated for the rendered viewport.
        this._previousLevelImage = this._previousGravityAligned && viewAligned ?
            { image: state.previousImage, transform: state.previousTransform } : null;
        this._previousLevelAspect = null;
        this._currentCamera = gravityAligned && state.currentTransform != null ?
            new Camera(state.currentTransform) : null;
        if (this._currentGravityAligned && this._currentCamera != null) {
            this._currentCamera.up.set(0, 0, 1);
        }
        this._previousCamera = viewAligned && state.previousTransform != null ?
            new Camera(state.previousTransform) :
            state.previousCamera == null ? null :
                gravityAligned ? new Camera(state.previousTransform) :
                    state.previousCamera.clone();
        if (viewAligned && state.previousTransform != null && this._previousCamera != null) {
            this._previousCamera.position.copy(sliderCameraOrigin(state.previousTransform));
        }
        if (this._previousGravityAligned && this._previousCamera != null) {
            this._previousCamera.up.set(0, 0, 1);
        }
        this._currentNativeUp = state.currentTransform != null ?
            state.currentTransform.upVector() : null;
        this._previousNativeUp = state.previousTransform != null ?
            state.previousTransform.upVector() : null;
        this._previousPerspective = null;
        this._previousRotation = null;
        this._headingRotation = sliderHeadingRotation(state.currentImage, state.previousImage);
        const motionless =
            state.motionless ||
            mode === SliderConfigurationMode.Stationary ||
            isSpherical(state.currentImage.cameraType);
        if (this.disabled || (viewAligned ? previousIdChanged : previousChanged)) {
            if (this._previousKey in this._previousProviderDisposers) {
                this._previousProviderDisposers[this._previousKey]();
                delete this._previousProviderDisposers[this._previousKey];
            }
        }
        if (this.disabled) {
            this._scene.setImagePlanesOld([]);
        } else {
            if (previousChanged || modeChanged || gravityAlignmentChanged ||
                viewAlignmentChanged || automaticChanged || viewAligned && currentChanged) {
                const previousNode: Image = automaticMotion ?
                    sliderReconstructionImage(state.previousImage) : state.previousImage;
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
                if (viewAligned && isSpherical(previousNode.cameraType)) {
                    pTranslation = translation;
                }
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
                if (viewAligned) {
                    // Fisheye and spherical factory paths do not honor the
                    // reconstruction flag. Hide only the old mesh, without
                    // mutating the cached image or its camera/lens metadata.
                    const meshImage: Image = motionless ?
                        Object.create(previousNode) : previousNode;
                    if (motionless) {
                        Object.defineProperty(meshImage, "mesh", { value: null });
                    }
                    mesh = this._factory.createMesh(
                        meshImage, previousTransform, !motionless);
                } else if (isSpherical(previousNode.cameraType)) {
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
                if (viewAligned && !previousIdChanged) {
                    this._preserveTextures(this._scene.planesOld, previousPlanes);
                }
                this._scene.setImagePlanesOld(previousPlanes);
            }
        }
        if (currentChanged || modeChanged || gravityAlignmentChanged ||
            viewAlignmentChanged || automaticChanged) {
            if ((!viewAligned || currentIdChanged) && this._currentKey in this._currentProviderDisposers) {
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
                            automaticMotion ? sliderReconstructionImage(state.currentImage) : state.currentImage,
                            currentTransform), camera: state.currentImage.camera}
                    );
                }
            }
            if (viewAligned && !currentIdChanged) {
                this._preserveTextures(this._scene.planes, planes);
            }
            this._scene.setImagePlanes(planes);
            this._updateCurtain();
        }
    }
    /** Rebuild only geometry/materials for same-id view-aligned mode changes.
     * Detach the old texture before scene disposal and retain the live provider
     * (its render-target texture will not be recreated on an unchanged id).
     */
    private _preserveTextures(oldPlanes: SliderMeshSceneItem[], newPlanes: SliderMeshSceneItem[]): void {
        for (const next of newPlanes) {
            const old = oldPlanes.filter(p => p.imageId === next.imageId)[0];
            if (!old) { continue; }
            const oldMaterial = old.mesh.material as SliderBBoxProjectorShaderMaterial;
            const nextMaterial = next.mesh.material as SliderBBoxProjectorShaderMaterial;
            const texture = oldMaterial.uniforms.projectorTex.value as THREE.Texture;
            const nextTexture = nextMaterial.uniforms.projectorTex.value as THREE.Texture;
            if (!texture) { continue; }
            // Never dispose the texture being handed over (a shared render target).
            if (nextTexture && nextTexture !== texture) { nextTexture.dispose(); }
            oldMaterial.uniforms.projectorTex.value = null;
            nextMaterial.uniforms.projectorTex.value = texture;
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
