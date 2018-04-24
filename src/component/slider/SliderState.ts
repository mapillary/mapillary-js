import {
    IBBoxShaderMaterial,
    IShaderMaterial,
    MeshFactory,
    MeshScene,
} from "../../Component";
import {Node} from "../../Graph";
import {
    ICurrentState,
    IFrame,
} from "../../State";

export class SliderState {
    private _factory: MeshFactory;
    private _scene: MeshScene;

    private _currentKey: string;
    private _previousKey: string;
    private _currentPano: boolean;

    private _frameId: number;

    private _glNeedsRender: boolean;
    private _sliderVisible: boolean;

    private _curtain: number;

    constructor() {
        this._factory = new MeshFactory();
        this._scene = new MeshScene();

        this._currentKey = null;
        this._previousKey = null;
        this._currentPano = false;

        this._frameId = 0;

        this._glNeedsRender = false;

        this._curtain = 1;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public get curtain(): number {
        return this._curtain;
    }

    public get glNeedsRender(): boolean {
        return this._glNeedsRender;
    }

    public get sliderVisible(): boolean {
        return this._sliderVisible;
    }

    public set sliderVisible(value: boolean) {
        this._sliderVisible = value;
    }

    public get disabled(): boolean {
        return this._currentKey == null ||
            this._previousKey == null ||
            this._currentPano;
    }

    public update(frame: IFrame): void {
        this._updateFrameId(frame.id);
        let needsRender: boolean = this._updateImagePlanes(frame.state);

        needsRender = this._updateCurtain(frame.state.alpha) || needsRender;
        this._glNeedsRender = needsRender || this._glNeedsRender;
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

        this._glNeedsRender = true;

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
    }

    public dispose(): void {
        this._scene.clear();
    }

    public clearGLNeedsRender(): void {
        this._glNeedsRender = false;
    }

    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }

    private _updateImagePlanes(state: ICurrentState): boolean {
        if (state.currentNode == null) {
            return;
        }

        let needsRender: boolean = false;

        if (state.previousNode != null && this._previousKey !== state.previousNode.key) {
            needsRender = true;

            this._previousKey = state.previousNode.key;
            this._scene.setImagePlanesOld([
                this._factory.createMesh(state.previousNode, state.previousTransform),
            ]);
        }

        if (this._currentKey !== state.currentNode.key) {
            needsRender = true;

            this._currentKey = state.currentNode.key;
            this._currentPano = state.currentNode.pano;
            this._scene.setImagePlanes([
                this._factory.createCurtainMesh(state.currentNode, state.currentTransform),
            ]);

            if (!this.disabled) {
                this._updateBbox();
            }
        }

        return needsRender;
    }

    private _updateCurtain(alpha: number): boolean {
        if (this.disabled ||
            Math.abs(this._curtain - alpha) < 0.001) {
            return false;
        }

        this._curtain = alpha;
        this._updateBbox();

        return true;
    }

    private _updateBbox(): void {
        for (let plane of this._scene.imagePlanes) {
            let shaderMaterial: IBBoxShaderMaterial = <IBBoxShaderMaterial>plane.material;
            let bbox: THREE.Vector4 = <THREE.Vector4>shaderMaterial.uniforms.bbox.value;

            bbox.z = this._curtain;
        }
    }
}

export default SliderState;
