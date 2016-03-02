/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {Node} from "../../Graph";
import {ICurrentState, IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
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

class SliderState {
    private _imagePlaneFactory: ImagePlaneFactory;
    private _imagePlaneScene: ImagePlaneScene;

    private _currentKey: string;
    private _previousKey: string;

    private _frameId: number;

    private _needsRender: boolean;

    constructor() {
        this._imagePlaneFactory = new ImagePlaneFactory();
        this._imagePlaneScene = new ImagePlaneScene();

        this._currentKey = null;
        this._previousKey = null;

        this._frameId = 0;

        this._needsRender = false;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public update(frame: IFrame): void {
        this._updateFrameId(frame.id);
        this._needsRender = this._needsRender || this._updateImagePlanes(frame.state);
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {
        renderer.render(this._imagePlaneScene.sceneOld, perspectiveCamera);
        renderer.render(this._imagePlaneScene.scene, perspectiveCamera);
    }

    public dispose(): void {
        this._imagePlaneScene.clear();
    }

    public clearNeedsRender(): void {
        this._needsRender = false;
    }

    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }

    private _updateImagePlanes(state: ICurrentState): boolean {
        if (state.currentNode == null) {
            return false;
        }

        let needsRender: boolean = false;

        if (state.previousNode != null && this._previousKey !== state.previousNode.key) {
            needsRender = true;
            this._previousKey = state.previousNode.key;
            this._imagePlaneScene.setImagePlanesOld([
                this._imagePlaneFactory.createMesh(state.previousNode, state.previousTransform),
            ]);
        }

        if (this._currentKey !== state.currentNode.key) {
            needsRender = true;
            this._currentKey = state.currentNode.key;
            this._imagePlaneScene.setImagePlanes([
                this._imagePlaneFactory.createMesh(state.currentNode, state.currentTransform),
            ]);
        }

        return needsRender;
    }
}

interface ISliderStateOperation {
    (sliderState: SliderState): SliderState;
}

export class SliderComponent extends Component {
    public static componentName: string = "slider";

    private _sliderStateOperation$: rx.Subject<ISliderStateOperation>;
    private _sliderState$: rx.Observable<SliderState>;

    private _stateSubscription: rx.IDisposable;
    private _sliderStateSubscription: rx.IDisposable;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._sliderStateOperation$ = new rx.Subject<ISliderStateOperation>();

        this._sliderState$ = this._sliderStateOperation$
            .scan<SliderState>(
                (sliderState: SliderState, operation: ISliderStateOperation): SliderState => {
                    return operation(sliderState);
                },
                new SliderState())
            .distinctUntilChanged(
                (sliderState: SliderState): number => {
                    return sliderState.frameId;
                });
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
        this._navigator.stateService.wait();

        this._stateSubscription = this._navigator.stateService.currentState$
            .map<ISliderStateOperation>(
                (frame: IFrame): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        sliderState.update(frame);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);

        this._sliderStateSubscription = this._sliderState$
            .map<IGLRenderHash>(
                (sliderState: SliderState): IGLRenderHash => {
                    let renderHash: IGLRenderHash = {
                        name: this._name,
                        render: {
                            frameId: sliderState.frameId,
                            needsRender: sliderState.needsRender,
                            render: sliderState.render.bind(sliderState),
                            stage: GLRenderStage.Background,
                        },
                    };

                    sliderState.clearNeedsRender();

                    return renderHash;
                })
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        this._navigator.stateService.traverse();

        this._stateSubscription.dispose();
        this._sliderStateSubscription.dispose();
    }
}

ComponentService.register(SliderComponent);
export default SliderComponent;
