/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

import {Node} from "../../Graph";
import {
    ICurrentState,
    IFrame,
    State,
} from "../../State";
import {
    Container,
    ImageSize,
    Navigator,
} from "../../Viewer";
import {
    IGLRenderHash,
    GLRenderStage,
} from "../../Render";
import {
    DOM,
    Settings,
} from "../../Utils";
import {
    IBBoxShaderMaterial,
    Component,
    ComponentService,
    ImagePlaneScene,
    ImagePlaneFactory,
    ISliderKeys,
    ISliderConfiguration,
    IShaderMaterial,
    SliderState,
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

export class SliderComponent extends Component<ISliderConfiguration> {
    public static componentName: string = "slider";

    private _dom: DOM;

    private _sliderContainer: HTMLDivElement;
    private _sliderWrapper: HTMLDivElement;
    private _sliderControl: HTMLInputElement;

    private _moveToHandler: (event: Event) => void;

    private _sliderStateOperation$: Subject<ISliderStateOperation>;
    private _sliderState$: Observable<SliderState>;
    private _sliderStateCreator$: Subject<void>;
    private _sliderStateDisposer$: Subject<void>;

    private _setKeysSubscription: Subscription;
    private _setSliderVisibleSubscription: Subscription;

    private _stateSubscription: Subscription;
    private _glRenderSubscription: Subscription;
    private _domRenderSubscription: Subscription;
    private _nodeSubscription: Subscription;

    /**
     * Create a new slider component instance.
     * @class SliderComponent
     */
    constructor (name: string, container: Container, navigator: Navigator, dom?: DOM) {
        super(name, container, navigator);

        this._dom = !!dom ? dom : new DOM();

        this._sliderStateOperation$ = new Subject<ISliderStateOperation>();
        this._sliderStateCreator$ = new Subject<void>();
        this._sliderStateDisposer$ = new Subject<void>();

        this._sliderState$ = this._sliderStateOperation$
            .scan(
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
            .map(
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
            .map(
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
        this._sliderContainer = this._dom.createElement("div", "mapillary-js-slider-container", this._container.element);
        this._sliderWrapper = this._dom.createElement("div", "SliderWrapper", this._sliderContainer);
        this._sliderControl = this._dom.createElement("input", "SliderControl", this._sliderWrapper);
        this._sliderControl.setAttribute("type", "range");
        this._sliderControl.setAttribute("min", "0");
        this._sliderControl.setAttribute("max", "1000");
        this._sliderControl.style.visibility = "hidden";

        this._moveToHandler = (e: Event): void => {
            const curtain: number = Number((<HTMLInputElement>e.target).value) / 1000;
            this._navigator.stateService.moveTo(curtain);
        };

        this._sliderControl.addEventListener("input", this._moveToHandler);
        this._sliderControl.addEventListener("change", this._moveToHandler);

        Observable
            .combineLatest<State, ISliderConfiguration>(
                this._navigator.stateService.state$,
                this._configuration$)
            .first()
            .subscribe(
                ([state, configuration]: [State, ISliderConfiguration]): void => {
                    if (state === State.Traversing) {
                        this._navigator.stateService.wait();

                        let position: number = configuration.initialPosition != null ? configuration.initialPosition : 1;

                        this._sliderControl.value = (1000 * position).toString();
                        this._navigator.stateService.moveTo(position);
                    }
                });

        this._glRenderSubscription = this._sliderState$
            .map(
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
            .subscribe(
                (sliderState: SliderState): void => {
                    this._sliderControl.value = (1000 * sliderState.curtain).toString();

                    const visibility: string = sliderState.disabled || !sliderState.sliderVisible ? "hidden" : "visible";
                    this._sliderControl.style.visibility = visibility;

                    sliderState.clearDomNeedsRender();
                });

        this._sliderStateCreator$.next(null);

        this._stateSubscription = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        sliderState.update(frame);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);

        this._setSliderVisibleSubscription = this._configuration$
            .map(
                (configuration: ISliderConfiguration): boolean => {
                    return configuration.sliderVisible == null || configuration.sliderVisible;
                })
            .distinctUntilChanged()
            .map(
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
            .switchMap(
                (configuration: ISliderConfiguration): Observable<ISliderCombination> => {
                    return Observable
                        .zip(
                            this._catchCacheNode$(configuration.keys.background),
                            this._catchCacheNode$(configuration.keys.foreground))
                        .map(
                            (nodes: [Node, Node]): ISliderNodes => {
                                return { background: nodes[0], foreground: nodes[1] };
                            })
                        .zip(this._navigator.stateService.currentState$.first())
                        .map(
                            (nf: [ISliderNodes, IFrame]): ISliderCombination => {
                                return { nodes: nf[0], state: nf[1].state };
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
                    console.error(e);
                });

        let previousNode$: Observable<Node> = this._navigator.stateService.currentState$
            .map(
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
                    let baseImageSize: ImageSize = node.pano ?
                        Settings.basePanoramaSize :
                        Settings.baseImageSize;

                    if (Math.max(node.image.width, node.image.height) > baseImageSize) {
                        return Observable.empty<[HTMLImageElement, Node]>();
                    }

                    return node.cacheImage$(Settings.maxImageSize)
                            .map(
                                (n: Node): [HTMLImageElement, Node] => {
                                    return [n.image, n];
                                })
                            .catch(
                                (error: Error, caught: Observable<[HTMLImageElement, Node]>):
                                    Observable<[HTMLImageElement, Node]> => {
                                    console.error(`Failed to fetch high res slider image (${node.key})`, error);

                                    return Observable.empty<[HTMLImageElement, Node]>();
                                });
                })
            .map(
                ([element, node]: [HTMLImageElement, Node]): ISliderStateOperation => {
                    return (sliderState: SliderState): SliderState => {
                        sliderState.updateTexture(element, node);

                        return sliderState;
                    };
                })
            .subscribe(this._sliderStateOperation$);
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

        this._sliderStateDisposer$.next(null);

        this._setKeysSubscription.unsubscribe();
        this._setSliderVisibleSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
        this._glRenderSubscription.unsubscribe();
        this._domRenderSubscription.unsubscribe();
        this._nodeSubscription.unsubscribe();

        this.configure({ keys: null });

        this._sliderControl.removeEventListener("input", this._moveToHandler);
        this._sliderControl.removeEventListener("change", this._moveToHandler);

        this._container.element.removeChild(this._sliderContainer);

        this._moveToHandler = null;
        this._sliderControl = null;
        this._sliderWrapper = null;
        this._sliderContainer = null;
    }

    protected _getDefaultConfiguration(): ISliderConfiguration {
        return {};
    }

    private _catchCacheNode$(key: string): Observable<Node> {
        return this._navigator.graphService.cacheNode$(key)
            .catch(
                (error: Error, caught: Observable<Node>): Observable<Node> => {
                    console.error(`Failed to cache slider node (${key})`, error);

                    return Observable.empty<Node>();
                });
    }
}

ComponentService.register(SliderComponent);
export default SliderComponent;
