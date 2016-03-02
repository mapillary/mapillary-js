/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {Node} from "../../Graph";
import {ICurrentState, IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage, IGLRenderFunction} from "../../Render";
import {Component, ComponentService, ImagePlaneScene, ImagePlaneFactory} from "../../Component";

interface ISliderKeys {
    background: string;
    foreground: string;
}

interface ISliderNodes {
    background: Node;
    foreground: Node;
}

interface ISliderCombination {
    nodes: ISliderNodes;
    state: ICurrentState;
}

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

    public setNodes(sliderKeys: ISliderKeys): void {
        if (!this._activated) {
            return;
        }

        rx.Observable
            .zip<Node, Node, ISliderNodes>(
                this._navigator.graphService.node$(sliderKeys.background),
                this._navigator.graphService.node$(sliderKeys.foreground),
                (background: Node, foreground: Node): ISliderNodes => {
                    return { background: background, foreground: foreground };
                })
            .withLatestFrom(
                this._navigator.stateService.currentState$,
                (nodes: ISliderNodes, frame: IFrame): ISliderCombination => {
                    return { nodes: nodes, state: frame.state };
                })
            .subscribe(
                (co: ISliderCombination): void => {
                    if (co.state.currentNode != null &&
                        co.state.previousNode != null &&
                        co.state.currentNode.key === co.nodes.foreground.key &&
                        co.state.previousNode.key === co.nodes.background.key) {
                        return;
                    }

                    if (co.state.currentNode.key === co.nodes.background.key) {
                        this._navigator.stateService.setNodes([co.nodes.foreground]);
                        return;
                    }

                    if (co.state.currentNode.key === co.nodes.foreground.key &&
                        co.state.trajectory.length === 1) {
                        this._navigator.stateService.prependNodes([co.nodes.background]);
                        return;
                    }

                    this._navigator.stateService.setNodes([co.nodes.background]);
                    this._navigator.stateService.setNodes([co.nodes.foreground]);
                },
                (e: Error): void => {
                    console.log(e);
                });
    }

    protected _activate(): void {
        this.imagePlaneFactory = new ImagePlaneFactory();
        this.imagePlaneScene = new ImagePlaneScene();

        this.currentKey = null;
        this.previousKey = null;

        let render: IGLRenderFunction = this.render.bind(this);

        this._navigator.stateService.wait();

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
        this._navigator.stateService.traverse();

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
            this.imagePlaneScene.setImagePlanesOld([
                this.imagePlaneFactory.createMesh(state.previousNode, state.previousTransform),
            ]);
        }

        if (this.currentKey !== state.currentNode.key) {
            needsRender = true;
            this.currentKey = state.currentNode.key;
            this.imagePlaneScene.setImagePlanes([
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
