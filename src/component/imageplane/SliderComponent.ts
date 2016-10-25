/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/observable/of";
import "rxjs/add/observable/zip";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/first";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/withLatestFrom";
import "rxjs/add/operator/zip";

import {
    ILoadStatusObject,
    ImageLoader,
    Node,
} from "../../Graph";
import {
    ICurrentState,
    IFrame,
    State,
} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";
import {
    IGLRenderHash,
    GLRenderStage,
    IVNodeHash,
} from "../../Render";
import {Settings} from "../../Utils";
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

    private _frameId: number;

    private _glNeedsRender: boolean;
    private _domNeedsRender: boolean;
    private _sliderVisible: boolean;

    private _motionless: boolean;

    private _curtain: number;

    constructor() {
        this._imagePlaneFactory = new ImagePlaneFactory();
        this._imagePlaneScene = new ImagePlaneScene();

        this._currentKey = null;
        this._previousKey = null;
        this._currentPano = false;

        this._frameId = 0;

        this._glNeedsRender = false;
        this._domNeedsRender = true;

        this._motionless = false;

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

    public get domNeedsRender(): boolean {
        return this._domNeedsRender;
    }

    public get sliderVisible(): boolean {
        return this._sliderVisible;
    }

    public set sliderVisible(value: boolean) {
        this._sliderVisible = value;
        this._domNeedsRender = true;
    }

    public get disabled(): boolean {
        return this._currentKey == null ||
            this._previousKey == null ||
            this._motionless ||
            this._currentPano;
    }

    public update(frame: IFrame): void {
        this._updateFrameId(frame.id);
        let needsRender: boolean = this._updateImagePlanes(frame.state);

        needsRender = this._updateCurtain(frame.state.alpha) || needsRender;
        this._glNeedsRender = needsRender || this._glNeedsRender;
        this._domNeedsRender = needsRender || this._domNeedsRender;
    }

    public updateTexture(image: HTMLImageElement, node: Node): void {
        let imagePlanes: THREE.Mesh[] = node.key === this._currentKey ?
            this._imagePlaneScene.imagePlanes :
            node.key === this._previousKey ?
                this._imagePlaneScene.imagePlanesOld :
                [];

        if (imagePlanes.length === 0) {
            return;
        }

        this._glNeedsRender = true;

        for (let plane of imagePlanes) {
            let material: THREE.ShaderMaterial = <THREE.ShaderMaterial>plane.material;
            let texture: THREE.Texture = <THREE.Texture>material.uniforms.projectorTex.value;

            texture.image = image;
            texture.needsUpdate = true;
        }
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

    public clearGLNeedsRender(): void {
        this._glNeedsRender = false;
    }

    public clearDomNeedsRender(): void {
        this._domNeedsRender = false;
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

export class SliderComponent extends Component<ISliderConfiguration> {
    public static componentName: string = "slider";

    private _sliderStateOperation$: Subject<ISliderStateOperation>;
    private _sliderState$: Observable<SliderState>;
    private _sliderStateCreator$: Subject<void>;
    private _sliderStateDisposer$: Subject<void>;

    private _setKeysSubscription: Subscription;
    private _setSliderVisibleSubscription: Subscription;
    private _elementSubscription: Subscription;

    private _stateSubscription: Subscription;
    private _glRenderSubscription: Subscription;
    private _domRenderSubscription: Subscription;
    private _nodeSubscription: Subscription;

    /**
     * Create a new slider component instance.
     * @class SliderComponent
     */
    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._sliderStateOperation$ = new Subject<ISliderStateOperation>();
        this._sliderStateCreator$ = new Subject<void>();
        this._sliderStateDisposer$ = new Subject<void>();

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
                undefined,
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

    /**
     * Set the image keys.
     *
     * Configures the component to show the image planes for the supplied image keys.
     *
     * @param {keys} ISliderKeys - Slider keys object specifying the images to be shown in the foreground and the background.
     */
    public setKeys(keys: ISliderKeys): void {
        this.configure({ keys: keys });
    }

    /**
     * Set the initial position.
     *
     * Configures the intial position of the slider. The inital position value will be used when the component is activated.
     *
     * @param {number} initialPosition - Initial slider position.
     */
    public setInitialPosition(initialPosition: number): void {
        this.configure({ initialPosition: initialPosition });
    }

    /**
     * Set the value controlling if the slider is visible.
     *
     * @param {boolean} sliderVisible - Value indicating if the slider should be visible or not.
     */
    public setSliderVisible(sliderVisible: boolean): void {
        this.configure({ sliderVisible: sliderVisible });
    }

    protected _activate(): void {
        this._container.mouseService.preventDefaultMouseDown$.next(false);
        this._container.touchService.preventDefaultTouchMove$.next(false);

        Observable
            .combineLatest<State, ISliderConfiguration>(
                this._navigator.stateService.state$,
                this._configuration$)
            .first()
            .subscribe(
                (stateConfig: [State, ISliderConfiguration]): void => {
                    if (stateConfig[0] === State.Traversing) {
                        this._navigator.stateService.wait();

                        let position: number = stateConfig[1].initialPosition;
                        this._navigator.stateService.moveTo(position != null ? position : 1);
                    }
                });

        this._glRenderSubscription = this._sliderState$
            .map<IGLRenderHash>(
                (sliderState: SliderState): IGLRenderHash => {
                    let renderHash: IGLRenderHash = {
                        name: this._name,
                        render: {
                            frameId: sliderState.frameId,
                            needsRender: sliderState.glNeedsRender,
                            render: sliderState.render.bind(sliderState),
                            stage: GLRenderStage.Background,
                        },
                    };

                    sliderState.clearGLNeedsRender();

                    return renderHash;
                })
            .subscribe(this._container.glRenderer.render$);

        this._domRenderSubscription = this._sliderState$
            .filter(
                (sliderState: SliderState): boolean => {
                    return sliderState.domNeedsRender;
                })
            .map<IVNodeHash>(
                (sliderState: SliderState): IVNodeHash => {
                    let sliderInput: vd.VNode = vd.h(
                        "input.SliderControl",
                        {
                            max: 1000,
                            min: 0,
                            type: "range",
                            value: 1000 * sliderState.curtain,
                        },
                        []);

                    let vNode: vd.VNode = sliderState.disabled || !sliderState.sliderVisible ?
                        null :
                        vd.h("div.SliderWrapper", {}, [sliderInput]);

                    let hash: IVNodeHash = {
                        name: this._name,
                        vnode: vNode,
                    };

                    sliderState.clearDomNeedsRender();

                    return hash;
                })
            .subscribe(this._container.domRenderer.render$);

        this._elementSubscription = this._container.domRenderer.element$
            .map<HTMLInputElement>(
                (e: Element): HTMLInputElement => {
                    let nodeList: NodeListOf<Element> = e.getElementsByClassName("SliderControl");

                    let slider: HTMLInputElement = nodeList.length > 0 ? <HTMLInputElement>nodeList[0] : null;

                    return slider;
                })
            .filter(
                (input: HTMLInputElement): boolean => {
                    return input != null;
                })
            .switchMap<Event>(
                (input: HTMLInputElement): Observable<Event> => {
                    return Observable.fromEvent<Event>(input, "input");
                })
            .map<number>(
                (e: Event): number => {
                    return Number((<HTMLInputElement>e.target).value) / 1000;
                })
            .subscribe(
                (curtain: number): void => {
                    this._navigator.stateService.moveTo(curtain);
                });

        this._sliderStateCreator$.next(null);

        this._stateSubscription = this._navigator.stateService.currentState$
            .map<ISliderStateOperation>(
                (frame: IFrame): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        sliderState.update(frame);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);

        this._setSliderVisibleSubscription = this._configuration$
            .map<boolean>(
                (configuration: ISliderConfiguration): boolean => {
                    return configuration.sliderVisible == null || configuration.sliderVisible;
                })
            .distinctUntilChanged()
            .map<ISliderStateOperation>(
                (sliderVisible: boolean): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        sliderState.sliderVisible = sliderVisible;

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);

        this._setKeysSubscription = this._configuration$
            .filter(
                (configuration: ISliderConfiguration): boolean => {
                    return configuration.keys != null;
                })
            .switchMap<ISliderCombination>(
                (configuration: ISliderConfiguration): Observable<ISliderCombination> => {
                    return Observable
                        .zip<ISliderNodes>(
                            [
                                this._navigator.graphService.cacheNode$(configuration.keys.background),
                                this._navigator.graphService.cacheNode$(configuration.keys.foreground),
                            ],
                            (background: Node, foreground: Node): ISliderNodes => {
                                return { background: background, foreground: foreground };
                            })
                        .withLatestFrom<ISliderCombination>(
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

        let previousNode$: Observable<Node> = this._navigator.stateService.currentState$
            .map<Node>(
                (frame: IFrame): Node => {
                    return frame.state.previousNode;
                })
            .filter(
                (node: Node): boolean => {
                    return node != null;
                })
            .distinctUntilChanged(
                undefined,
                (node: Node): string => {
                    return node.key;
                });

        this._nodeSubscription = Observable
            .merge(
                previousNode$,
                this._navigator.stateService.currentNode$)
            .filter(
                (node: Node): boolean => {
                    return node.pano ?
                        Settings.maxImageSize > Settings.basePanoramaSize :
                        Settings.maxImageSize > Settings.baseImageSize;
                })
            .mergeMap(
                (node: Node): Observable<[HTMLImageElement, Node]> => {
                    return ImageLoader.loadThumbnail(node.key, Settings.maxImageSize)
                        .filter(
                            (statusObject: ILoadStatusObject<HTMLImageElement>): boolean => {
                                return statusObject.object != null;
                            })
                        .first()
                        .map<HTMLImageElement>(
                            (statusObject: ILoadStatusObject<HTMLImageElement>): HTMLImageElement => {
                                return statusObject.object;
                            })
                        .zip(
                            Observable.of<Node>(node),
                            (t: HTMLImageElement, n: Node): [HTMLImageElement, Node] => {
                                return [t, n];
                            });
                })
            .map<ISliderStateOperation>(
                (imn: [HTMLImageElement, Node]): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        sliderState.updateTexture(imn[0], imn[1]);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);
    }

    protected _deactivate(): void {
        this._container.mouseService.preventDefaultMouseDown$.next(true);
        this._container.touchService.preventDefaultTouchMove$.next(true);

        this._navigator.stateService.state$
            .first()
            .subscribe(
                (state: State): void => {
                    if (state === State.Waiting) {
                        this._navigator.stateService.traverse();
                    }
                });

        this._sliderStateDisposer$.next(null);

        this._setKeysSubscription.unsubscribe();
        this._setSliderVisibleSubscription.unsubscribe();
        this._elementSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
        this._glRenderSubscription.unsubscribe();
        this._domRenderSubscription.unsubscribe();
        this._nodeSubscription.unsubscribe();

        this.configure({ keys: null });
    }

    protected _getDefaultConfiguration(): ISliderConfiguration {
        return {};
    }
}

ComponentService.register(SliderComponent);
export default SliderComponent;
