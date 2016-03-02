/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {Node} from "../../Graph";
import {ICurrentState, IFrame, State} from "../../State";
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
    private _currentPano: boolean;
    private _previousPano: boolean;

    private _frameId: number;

    private _needsRender: boolean;

    constructor() {
        this._imagePlaneFactory = new ImagePlaneFactory();
        this._imagePlaneScene = new ImagePlaneScene();

        this._currentKey = null;
        this._previousKey = null;
        this._currentPano = false;
        this._previousPano = false;

        this._frameId = 0;

        this._needsRender = false;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public updateFrame(frame: IFrame): void {
        this._updateFrameId(frame.id);
        this._updateImagePlanes(frame.state);
    }

    public updateCurtain(curtain: number): void {
        if (this._pano) {
            return;
        }

        this._needsRender = true;

        for (let plane of this._imagePlaneScene.imagePlanes) {
            let shaderMaterial: THREE.ShaderMaterial = <THREE.ShaderMaterial>plane.material;
            let bbox: THREE.Vector4 = <THREE.Vector4>shaderMaterial.uniforms.bbox.value;

            bbox.z = curtain;
        }
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

    private get _pano(): boolean {
        return this._currentPano || this._previousPano;
    }

    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }

    private _updateImagePlanes(state: ICurrentState): void {
        if (state.currentNode == null) {
            return;
        }

        let needsRender: boolean = false;

        if (state.previousNode != null && this._previousKey !== state.previousNode.key) {
            needsRender = true;

            this._previousKey = state.previousNode.key;
            this._previousPano = state.previousNode.pano;
            this._imagePlaneScene.setImagePlanesOld([
                this._imagePlaneFactory.createMesh(state.previousNode, state.previousTransform),
            ]);
        }

        if (this._currentKey !== state.currentNode.key) {
            needsRender = true;

            this._currentKey = state.currentNode.key;
            this._currentPano = state.currentNode.pano;
            this._imagePlaneScene.setImagePlanes([
                this._imagePlaneFactory.createMesh(state.currentNode, state.currentTransform),
            ]);
        }

        this._needsRender = needsRender;
    }
}

interface ISliderStateOperation {
    (sliderState: SliderState): SliderState;
}

export class SliderComponent extends Component {
    public static componentName: string = "slider";

    private _sliderStateOperation$: rx.Subject<ISliderStateOperation>;
    private _sliderState$: rx.Observable<SliderState>;
    private _sliderStateCreator$: rx.Subject<void>;
    private _sliderStateDisposer$: rx.Subject<void>;

    private _stateSubscription: rx.IDisposable;
    private _mouseMoveSubscription: rx.IDisposable;
    private _sliderStateSubscription: rx.IDisposable;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._sliderStateOperation$ = new rx.Subject<ISliderStateOperation>();
        this._sliderStateCreator$ = new rx.Subject<void>();
        this._sliderStateDisposer$ = new rx.Subject<void>();

        this._sliderState$ = this._sliderStateOperation$
            .scan<SliderState>(
                (sliderState: SliderState, operation: ISliderStateOperation): SliderState => {
                    return operation(sliderState);
                },
                null)
            .filter(
                (sliderState: SliderState): boolean => {
                    return sliderState != null;
                })
            .distinctUntilChanged(
                (sliderState: SliderState): number => {
                    return sliderState.frameId;
                });

        this._sliderStateCreator$
            .map<ISliderStateOperation>(
                (): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        if (sliderState != null) {
                            throw new Error("Multiple slider states can not be created at the same time");
                        }

                        return new SliderState();
                    };
                })
            .subscribe(this._sliderStateOperation$);

        this._sliderStateDisposer$
            .map<ISliderStateOperation>(
                (): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        sliderState.dispose();

                        return null;
                    };
                })
            .subscribe(this._sliderStateOperation$);
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
        if (this._navigator.stateService.state === State.Traversing) {
            this._navigator.stateService.wait();
        }

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

        this._sliderStateCreator$.onNext(null);

        this._stateSubscription = this._navigator.stateService.currentState$
            .map<ISliderStateOperation>(
                (frame: IFrame): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        sliderState.updateFrame(frame);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);

        this._mouseMoveSubscription = this._container.mouseService.mouseMove$
            .map<ISliderStateOperation>(
                (event: MouseEvent): ISliderStateOperation => {
                    let curtain: number = event.offsetX / this._container.element.offsetWidth;

                    this._navigator.stateService.moveTo(curtain);

                    return (sliderState: SliderState): SliderState => {
                        sliderState.updateCurtain(curtain);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);
    }

    protected _deactivate(): void {
        if (this._navigator.stateService.state === State.Waiting) {
            this._navigator.stateService.traverse();
        }

        this._sliderStateDisposer$.onNext(null);

        this._stateSubscription.dispose();
        this._mouseMoveSubscription.dispose();
        this._sliderStateSubscription.dispose();
    }
}

ComponentService.register(SliderComponent);
export default SliderComponent;
