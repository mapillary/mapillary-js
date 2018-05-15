/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { Subject } from "rxjs/Subject";

import { ViewportCoords, Transform } from "../../Geo";
import { Node } from "../../Graph";
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
    GLRenderStage,
    IGLRenderHash,
    ISize,
    IVNodeHash,
    RenderCamera,
} from "../../Render";
import {
    DOM,
    Settings,
} from "../../Utils";
import {
    Component,
    ComponentService,
    ISliderConfiguration,
    ISliderKeys,
    SliderDOMRenderer,
    SliderGLRenderer,
    SliderMode,
} from "../../Component";

interface ISliderNodes {
    background: Node;
    foreground: Node;
}

interface ISliderCombination {
    nodes: ISliderNodes;
    state: ICurrentState;
}

interface IGLRendererOperation {
    (glRenderer: SliderGLRenderer): SliderGLRenderer;
}

export class SliderComponent extends Component<ISliderConfiguration> {
    public static componentName: string = "slider";

    private _viewportCoords: ViewportCoords;
    private _domRenderer: SliderDOMRenderer;

    private _glRendererOperation$: Subject<IGLRendererOperation>;
    private _glRenderer$: Observable<SliderGLRenderer>;
    private _glRendererCreator$: Subject<void>;
    private _glRendererDisposer$: Subject<void>;

    private _setKeysSubscription: Subscription;

    private _modeSubcription: Subscription;
    private _stateSubscription: Subscription;
    private _glRenderSubscription: Subscription;
    private _domRenderSubscription: Subscription;
    private _nodeSubscription: Subscription;
    private _moveSubscription: Subscription;
    private _updateCurtainSubscription: Subscription;
    private _waitSubscription: Subscription;

    /**
     * Create a new slider component instance.
     * @class SliderComponent
     */
    constructor (name: string, container: Container, navigator: Navigator, viewportCoords?: ViewportCoords) {
        super(name, container, navigator);

        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();
        this._domRenderer = new SliderDOMRenderer(container);

        this._glRendererOperation$ = new Subject<IGLRendererOperation>();
        this._glRendererCreator$ = new Subject<void>();
        this._glRendererDisposer$ = new Subject<void>();

        this._glRenderer$ = this._glRendererOperation$
            .scan(
                (glRenderer: SliderGLRenderer, operation: IGLRendererOperation): SliderGLRenderer => {
                    return operation(glRenderer);
                },
                null)
            .filter(
                (glRenderer: SliderGLRenderer): boolean => {
                    return glRenderer != null;
                })
            .distinctUntilChanged(
                undefined,
                (glRenderer: SliderGLRenderer): number => {
                    return glRenderer.frameId;
                });

        this._glRendererCreator$
            .map(
                (): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        if (glRenderer != null) {
                            throw new Error("Multiple slider states can not be created at the same time");
                        }

                        return new SliderGLRenderer();
                    };
                })
            .subscribe(this._glRendererOperation$);

        this._glRendererDisposer$
            .map(
                (): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        glRenderer.dispose();

                        return null;
                    };
                })
            .subscribe(this._glRendererOperation$);
    }

    /**
     * Set the initial position.
     *
     * @description Configures the intial position of the slider.
     * The inital position value will be used when the component
     * is activated.
     *
     * @param {number} initialPosition - Initial slider position.
     */
    public setInitialPosition(initialPosition: number): void {
        this.configure({ initialPosition: initialPosition });
    }

    /**
     * Set the image keys.
     *
     * @description Configures the component to show the image
     * planes for the supplied image keys.
     *
     * @param {ISliderKeys} keys - Slider keys object specifying
     * the images to be shown in the foreground and the background.
     */
    public setKeys(keys: ISliderKeys): void {
        this.configure({ keys: keys });
    }

    /**
     * Set the slider mode.
     *
     * @description Configures the mode for transitions between
     * image pairs.
     *
     * @param {SliderMode} mode - Slider mode to be set.
     */
    public setSliderMode(mode: SliderMode): void {
        this.configure({ mode: mode });
    }

    /**
     * Set the value controlling if the slider is visible.
     *
     * @param {boolean} sliderVisible - Value indicating if
     * the slider should be visible or not.
     */
    public setSliderVisible(sliderVisible: boolean): void {
        this.configure({ sliderVisible: sliderVisible });
    }

    protected _activate(): void {
        this._modeSubcription = this._domRenderer.mode$
            .subscribe(
                (mode: SliderMode): void => {
                    this.setSliderMode(mode);
                });

        this._glRenderSubscription = this._glRenderer$
            .map(
                (glRenderer: SliderGLRenderer): IGLRenderHash => {
                    let renderHash: IGLRenderHash = {
                        name: this._name,
                        render: {
                            frameId: glRenderer.frameId,
                            needsRender: glRenderer.needsRender,
                            render: glRenderer.render.bind(glRenderer),
                            stage: GLRenderStage.Background,
                        },
                    };

                    return renderHash;
                })
            .subscribe(this._container.glRenderer.render$);

        const position$: Observable<number> = this.configuration$
            .map(
                (configuration: ISliderConfiguration): number => {
                    return configuration.initialPosition != null ?
                        configuration.initialPosition : 1;
                })
            .first()
            .concat(this._domRenderer.position$);

        const mode$: Observable<SliderMode> = this.configuration$
            .map(
                (configuration: ISliderConfiguration): SliderMode => {
                    return configuration.mode;
                })
            .distinctUntilChanged();

        const motionless$: Observable<boolean> = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): boolean => {
                    return frame.state.motionless;
                })
            .distinctUntilChanged();

        const pano$: Observable<boolean> = this._navigator.stateService.currentState$
            .map(
                (frame: IFrame): boolean => {
                    return frame.state.currentNode.pano;
                })
            .distinctUntilChanged();

        const sliderVisible$: Observable<boolean> = Observable
            .combineLatest(
                this._configuration$
                    .map(
                        (configuration: ISliderConfiguration): boolean => {
                            return configuration.sliderVisible;
                        }),
                this._navigator.stateService.currentState$
                    .map(
                        (frame: IFrame): string => {
                            return !!frame.state.previousNode ? frame.state.previousNode.key : null;
                        })
                    .distinctUntilChanged())
            .map(
                ([sliderVisible, previousKey]: [boolean, string]): boolean => {
                    return sliderVisible && previousKey != null;
                })
            .distinctUntilChanged();

        this._waitSubscription = Observable
            .combineLatest(
                mode$,
                motionless$,
                pano$)
            .withLatestFrom(this._navigator.stateService.state$)
            .subscribe(
                ([[mode, motionless, pano], state]: [[SliderMode, boolean, boolean], State]): void => {
                    const interactive: boolean = motionless || mode === SliderMode.Stationary || pano;

                    if (interactive && state !== State.WaitingInteractively) {
                        this._navigator.stateService.waitInteractively();
                    } else if (!interactive && state !== State.Waiting) {
                        this._navigator.stateService.wait();
                    }
                });

        this._moveSubscription = Observable
            .combineLatest(
                this._domRenderer.position$,
                mode$,
                motionless$,
                pano$)
            .subscribe(
                ([position, mode, motionless, pano]: [number, SliderMode, boolean, boolean]): void => {
                    if (motionless || mode === SliderMode.Stationary || pano) {
                        this._navigator.stateService.moveTo(1);
                    } else {
                        this._navigator.stateService.moveTo(position);
                    }
                });

        this._domRenderSubscription = Observable
            .combineLatest(
                position$,
                mode$,
                motionless$,
                pano$,
                sliderVisible$,
                this._container.renderService.size$)
            .map(
                ([position, mode, motionless, pano, sliderVisible, size]:
                    [number, SliderMode, boolean, boolean, boolean, ISize]): IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: this._domRenderer.render(position, mode, motionless, pano, sliderVisible),
                    };
                })
            .subscribe(this._container.domRenderer.render$);

        this._glRendererCreator$.next(null);

        this._updateCurtainSubscription = Observable
            .combineLatest(
                this.configuration$
                    .first()
                    .map(
                        (configuration: ISliderConfiguration): number => {
                            return configuration.initialPosition;
                        })
                    .concat(this._domRenderer.position$),
                pano$,
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
            .map(
                ([position, pano, render, transform]: [number, boolean, RenderCamera, Transform]): number => {
                    if (!pano) {
                        return position;
                    }

                    const basicMin: number[] = this._viewportCoords.viewportToBasic(-1.15, 0, transform, render.perspective);
                    const basicMax: number[] = this._viewportCoords.viewportToBasic(1.15, 0, transform, render.perspective);

                    const shiftedMax: number = basicMax[0] < basicMin[0] ? basicMax[0] + 1 : basicMax[0];
                    const basicPosition: number = basicMin[0] + position * (shiftedMax - basicMin[0]);

                    return basicPosition > 1 ? basicPosition - 1 : basicPosition;
                })
            .map(
                (position: number): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        glRenderer.updateCurtain(position);

                        return glRenderer;
                    };
                })
            .subscribe(this._glRendererOperation$);

        this._stateSubscription = Observable
            .combineLatest(
                this._navigator.stateService.currentState$,
                mode$)
            .map(
                ([frame, mode]: [IFrame, SliderMode]): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        glRenderer.update(frame, mode);

                        return glRenderer;
                    };
                })
            .subscribe(this._glRendererOperation$);

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
                ([element, node]: [HTMLImageElement, Node]): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        glRenderer.updateTexture(element, node);

                        return glRenderer;
                    };
                })
            .subscribe(this._glRendererOperation$);
    }

    protected _deactivate(): void {
        this._waitSubscription.unsubscribe();

        this._navigator.stateService.state$
            .first()
            .subscribe(
                (state: State): void => {
                    if (state !== State.Traversing) {
                        this._navigator.stateService.traverse();
                    }
                });

        this._glRendererDisposer$.next(null);
        this._domRenderer.deactivate();

        this._modeSubcription.unsubscribe();
        this._setKeysSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
        this._glRenderSubscription.unsubscribe();
        this._domRenderSubscription.unsubscribe();
        this._nodeSubscription.unsubscribe();
        this._moveSubscription.unsubscribe();

        this.configure({ keys: null });
    }

    protected _getDefaultConfiguration(): ISliderConfiguration {
        return {
            initialPosition: 1,
            mode: SliderMode.Motion,
            sliderVisible: true,
        };
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
