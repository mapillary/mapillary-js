/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {ComponentService, Component, ImagePlaneScene, ImagePlaneFactory} from "../../Component";
import {ICurrentState, IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage, IGLRenderFunction} from "../../Render";
import {Camera} from "../../Geo";

export class ImagePlaneComponent extends Component {
    public static componentName: string = "imageplane";
    private _disposable: rx.IDisposable;

    private imagePlaneFactory: ImagePlaneFactory;
    private imagePlaneScene: ImagePlaneScene;

    private alpha: number;
    private alphaOld: number;
    private fadeOutSpeed: number;
    private lastCamera: Camera;
    private epsilon: number;

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

        this.imagePlaneFactory = new ImagePlaneFactory();
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
                        stage: GLRenderStage.Background,
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
                let previousMesh: THREE.Mesh =
                    this.imagePlaneFactory.createMesh(state.previousNode, state.previousTransform);

                this.imagePlaneScene.updateImagePlanes([previousMesh]);
            }
        }

        this.currentKey = state.currentNode.key;
        let currentMesh: THREE.Mesh =
            this.imagePlaneFactory.createMesh(state.currentNode, state.currentTransform);

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
}

ComponentService.register(ImagePlaneComponent);
export default ImagePlaneComponent;
