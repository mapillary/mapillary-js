/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {ICurrentState, IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage, IGLRenderFunction} from "../../Render";
import {Component, ComponentService, ImagePlaneScene, ImagePlaneFactory} from "../../Component";

export class SliderComponent extends Component {
    public static componentName: string = "slider";

    private _subscription: rx.IDisposable;

    private imagePlaneFactory: ImagePlaneFactory;
    private imagePlaneScene: ImagePlaneScene;

    private currentKey: string;
    private previousKey: string;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this.imagePlaneFactory = new ImagePlaneFactory();
        this.imagePlaneScene = new ImagePlaneScene();

        this.currentKey = null;
        this.previousKey = null;

        let render: IGLRenderFunction = this.render.bind(this);

        this._subscription = this._navigator.stateService.currentState$
            .map<IGLRenderHash>(
                (frame: IFrame): IGLRenderHash => {
                    let needsRender: boolean = this.updateImagePlanes(frame.state);

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
        this._subscription.dispose();
    }

    private updateImagePlanes(state: ICurrentState): boolean {
        if (state.currentNode == null) {
            return false;
        }

        let needsRender: boolean = false;

        if (state.previousNode != null && this.previousKey !== state.previousNode.key) {
            needsRender = true;
            this.previousKey = state.previousNode.key;
            this.imagePlaneScene.updateImagePlanes([
                this.imagePlaneFactory.createMesh(state.previousNode, state.previousTransform),
            ]);
        }

        if (this.currentKey !== state.currentNode.key) {
            needsRender = true;
            this.currentKey = state.currentNode.key;
            this.imagePlaneScene.updateImagePlanes([
                this.imagePlaneFactory.createMesh(state.currentNode, state.currentTransform),
            ]);
        }

        return needsRender;
    }

    private render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {
        renderer.render(this.imagePlaneScene.sceneOld, perspectiveCamera);
        renderer.render(this.imagePlaneScene.scene, perspectiveCamera);
    }
}

ComponentService.register(SliderComponent);
export default SliderComponent;
