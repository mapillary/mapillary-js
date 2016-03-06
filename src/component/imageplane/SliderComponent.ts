/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {Node} from "../../Graph";
import {ICurrentState, IFrame, State} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
import {
    Component,
    ComponentService,
    ImagePlaneScene,
    ImagePlaneFactory,
    ISliderKeys,
    ISliderConfiguration,
} from "../../Component";

interface ISliderNodes {
    background: Node;
    foreground: Node;
}

interface ISliderCombination {
    nodes: ISliderNodes;
    state: ICurrentState;
}

interface ISliderStateOperation {
    (sliderState: SliderState): SliderState;
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

    private _motionless: boolean;

    private _curtain: number;

    constructor() {
        this._imagePlaneFactory = new ImagePlaneFactory();
        this._imagePlaneScene = new ImagePlaneScene();

        this._currentKey = null;
        this._previousKey = null;
        this._currentPano = false;
        this._previousPano = false;

        this._frameId = 0;

        this._needsRender = false;

        this._motionless = false;

        this._curtain = 1;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public get disabled(): boolean {
        return this._currentKey == null ||
            this._previousKey == null ||
            this._motionless ||
            this._currentPano ||
            this._previousPano;
    }

    public update(frame: IFrame): void {
        this._updateFrameId(frame.id);
        this._needsRender = this._updateImagePlanes(frame.state);
        this._needsRender = this._updateCurtain(frame.state.alpha) || this._needsRender;
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        if (!this.disabled) {
            renderer.render(this._imagePlaneScene.sceneOld, perspectiveCamera);
        }

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
            return;
        }

        let needsRender: boolean = false;

        if (state.previousNode != null && this._previousKey !== state.previousNode.key) {
            needsRender = true;

            this._previousKey = state.previousNode.key;
            this._previousPano = state.previousNode.pano;
            this._motionless = state.motionless;
            this._imagePlaneScene.setImagePlanesOld([
                this._imagePlaneFactory.createMesh(state.previousNode, state.previousTransform),
            ]);
        }

        if (this._currentKey !== state.currentNode.key) {
            needsRender = true;

            this._currentKey = state.currentNode.key;
            this._currentPano = state.currentNode.pano;
            this._motionless = state.motionless;
            this._imagePlaneScene.setImagePlanes([
                this._imagePlaneFactory.createMesh(state.currentNode, state.currentTransform),
            ]);
        }

        return needsRender;
    }

    private _updateCurtain(alpha: number): boolean {
        if (this.disabled ||
            Math.abs(this._curtain - alpha) < 0.001) {
            return false;
        }

        this._curtain = alpha;

        for (let plane of this._imagePlaneScene.imagePlanes) {
            let shaderMaterial: THREE.ShaderMaterial = <THREE.ShaderMaterial>plane.material;
            let bbox: THREE.Vector4 = <THREE.Vector4>shaderMaterial.uniforms.bbox.value;

            bbox.z = this._curtain;
        }

        return true;
    }
}

export class SliderComponent extends Component {
    public static componentName: string = "slider";

    private _configurationSubscription: rx.IDisposable;

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
        this.configure({ keys: sliderKeys });
    }

    protected _activate(): void {
        this._navigator.stateService.state$
            .first()
            .subscribe(
                (state: State): void => {
                    if (state === State.Traversing) {
                        this._navigator.stateService.wait();
                    }
                });

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
                        sliderState.update(frame);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);

        this._mouseMoveSubscription = this._container.mouseService.mouseMove$
            .map<ISliderStateOperation>(
                (event: MouseEvent): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        if (sliderState.disabled) {
                            return sliderState;
                        }

                        let curtain: number = event.offsetX / this._container.element.offsetWidth;

                        this._navigator.stateService.moveTo(curtain);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);

        this._configurationSubscription = this._configuration$
            .filter(
                (configuration: ISliderConfiguration): boolean => {
                    return configuration.keys != null;
                })
            .flatMapLatest<ISliderCombination>(
                (configuration: ISliderConfiguration): rx.Observable<ISliderCombination> => {
                    return rx.Observable
                        .zip<Node, Node, ISliderNodes>(
                            this._navigator.graphService.node$(configuration.keys.background),
                            this._navigator.graphService.node$(configuration.keys.foreground),
                            (background: Node, foreground: Node): ISliderNodes => {
                                return { background: background, foreground: foreground };
                            })
                        .withLatestFrom(
                            this._navigator.stateService.currentState$,
                            (nodes: ISliderNodes, frame: IFrame): ISliderCombination => {
                                return { nodes: nodes, state: frame.state };
                            });
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

    protected _deactivate(): void {
        this._navigator.stateService.state$
            .first()
            .subscribe(
                (state: State): void => {
                    if (state === State.Waiting) {
                        this._navigator.stateService.traverse();
                    }
                });

        this._sliderStateDisposer$.onNext(null);

        this._configurationSubscription.dispose();

        this._stateSubscription.dispose();
        this._mouseMoveSubscription.dispose();
        this._sliderStateSubscription.dispose();

        this.configure({ keys: null });
    }
}

ComponentService.register(SliderComponent);
export default SliderComponent;
