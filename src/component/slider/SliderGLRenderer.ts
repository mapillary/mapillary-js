import {
    IBBoxShaderMaterial,
    IShaderMaterial,
    MeshFactory,
    MeshScene,
    SliderMode,
} from "../../Component";
import { Node } from "../../Graph";
import {
    ICurrentState,
    IFrame,
} from "../../State";

export class SliderGLRenderer {
    private _factory: MeshFactory;
    private _scene: MeshScene;

    private _currentKey: string;
    private _previousKey: string;

    private _disabled: boolean;
    private _curtain: number;
    private _frameId: number;
    private _needsRender: boolean;

    private _mode: SliderMode;

    constructor() {
        this._factory = new MeshFactory();
        this._scene = new MeshScene();

        this._currentKey = null;
        this._previousKey = null;

        this._disabled = false;
        this._curtain = 1;
        this._frameId = 0;
        this._needsRender = false;

        this._mode = null;
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

    public update(frame: IFrame, mode: SliderMode): void {
        this._updateFrameId(frame.id);
        this._updateImagePlanes(frame.state, mode);
    }

    public updateCurtain(curtain: number): void {
        if (this.disabled || Math.abs(this._curtain - curtain) < 0.001) {
            return;
        }

        this._curtain = curtain;
        this._updateCurtain();

        this._needsRender = true;
    }

    public updateTexture(image: HTMLImageElement, node: Node): void {
        let imagePlanes: THREE.Mesh[] = node.key === this._currentKey ?
            this._scene.imagePlanes :
            node.key === this._previousKey ?
                this._scene.imagePlanesOld :
                [];

        if (imagePlanes.length === 0) {
            return;
        }

        this._needsRender = true;

        for (let plane of imagePlanes) {
            let material: IShaderMaterial = <IShaderMaterial>plane.material;
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
    }

    private _setDisabled(state: ICurrentState): void {
        this._disabled = state.currentNode == null ||
            state.previousNode == null ||
            (state.currentNode.pano && !state.currentNode.fullPano) ||
            (!state.currentNode.fullPano && state.previousNode.pano) ||
            (state.currentNode.fullPano && !state.previousNode.fullPano);
    }

    private _updateCurtain(): void {
        for (let plane of this._scene.imagePlanes) {
            let shaderMaterial: IBBoxShaderMaterial = <IBBoxShaderMaterial>plane.material;
            shaderMaterial.uniforms.curtain.value = this._curtain;
        }
    }

    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }

    private _updateImagePlanes(state: ICurrentState, mode: SliderMode): void {
        const currentChanged: boolean = state.currentNode != null && this._currentKey !== state.currentNode.key;
        const previousChanged: boolean = state.previousNode != null && this._previousKey !== state.previousNode.key;
        const modeChanged: boolean = this._mode !== mode;

        if (!(currentChanged || previousChanged || modeChanged)) {
            return;
        }

        this._setDisabled(state);
        this._needsRender = true;
        this._mode = mode;

        const motionless: boolean = state.motionless || mode === SliderMode.Stationary;

        if (this.disabled) {
            this._scene.setImagePlanesOld([]);
        } else {
            if (previousChanged || modeChanged) {
                this._previousKey = state.previousNode.key;

                let mesh: THREE.Mesh = undefined;

                if (state.previousNode.fullPano) {
                    mesh = this._factory.createMesh(
                        state.previousNode,
                        state.currentTransform);
                } else {
                    if (motionless) {
                        const currentAspect: number = state.currentTransform.basicAspect;
                        const previousAspect: number = state.previousTransform.basicAspect;

                        if (currentAspect > previousAspect) {
                            if (currentAspect > 1) {
                                mesh = this._factory.createScaledFlatMesh(
                                    state.previousNode,
                                    state.currentTransform,
                                    0.5,
                                    0.5 / previousAspect);
                            } else {
                                mesh = this._factory.createScaledFlatMesh(
                                    state.previousNode,
                                    state.currentTransform,
                                    0.5 * currentAspect,
                                    0.5 * currentAspect / previousAspect);
                            }
                        } else {
                            if (currentAspect > 1) {
                                mesh = this._factory.createScaledFlatMesh(
                                    state.previousNode,
                                    state.currentTransform,
                                    0.5 * previousAspect / currentAspect,
                                    0.5 / currentAspect);
                            } else {
                                mesh = this._factory.createScaledFlatMesh(
                                    state.previousNode,
                                    state.currentTransform,
                                    0.5 * previousAspect,
                                    0.5);
                            }
                        }
                    } else {
                        mesh = this._factory.createMesh(state.previousNode, state.previousTransform);
                    }
                }

                this._scene.setImagePlanesOld([mesh]);
            }
        }

        if (currentChanged) {
            this._currentKey = state.currentNode.key;

            this._scene.setImagePlanes([
                this._factory.createCurtainMesh(state.currentNode, state.currentTransform),
            ]);

            if (!this.disabled) {
                this._updateCurtain();
            }
        }
    }
}

export default SliderGLRenderer;
