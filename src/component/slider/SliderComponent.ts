import {
    concat as observableConcat,
    of as observableOf,
    zip as observableZip,
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    Observable,
    Subscription,
    Subject,
} from "rxjs";

import {
    publishReplay,
    pairwise,
    catchError,
    takeUntil,
    publish,
    skipWhile,
    scan,
    filter,
    debounceTime,
    startWith,
    map,
    switchMap,
    withLatestFrom,
    refCount,
    first,
    distinctUntilChanged,
} from "rxjs/operators";

import * as THREE from "three";

import {
    ISliderNodes,
    ISliderCombination,
    IGLRendererOperation,
    PositionLookat,
} from "./interfaces/interfaces";

import {
    Component,
    ComponentService,
    ISliderConfiguration,
    ISliderKeys,
    SliderDOMRenderer,
    SliderGLRenderer,
    SliderMode,
} from "../../Component";
import {
    Spatial,
    Transform,
    ViewportCoords,
} from "../../Geo";
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
    IBoundingBox,
    ImageTileLoader,
    ImageTileStore,
    IRegionOfInterest,
    RegionOfInterestCalculator,
    TextureProvider,
} from "../../Tiles";
import {
    Settings,
    Urls,
} from "../../Utils";

/**
 * @class SliderComponent
 *
 * @classdesc Component for comparing pairs of images. Renders
 * a slider for adjusting the curtain of the first image.
 *
 * Deactivate the sequence, direction and image plane
 * components when activating the slider component to avoid
 * interfering UI elements.
 *
 * To retrive and use the slider component
 *
 * @example
 * ```
 * var viewer = new Mapillary.Viewer(
 *     "<element-id>",
 *     "<client-id>",
 *     "<my key>");
 *
 * viewer.deactivateComponent("imagePlane");
 * viewer.deactivateComponent("direction");
 * viewer.deactivateComponent("sequence");
 *
 * viewer.activateComponent("slider");
 *
 * var sliderComponent = viewer.getComponent("slider");
 * ```
 */
export class SliderComponent extends Component<ISliderConfiguration> {
    public static componentName: string = "slider";

    private _viewportCoords: ViewportCoords;
    private _domRenderer: SliderDOMRenderer;
    private _imageTileLoader: ImageTileLoader;
    private _roiCalculator: RegionOfInterestCalculator;
    private _spatial: Spatial;

    private _glRendererOperation$: Subject<IGLRendererOperation>;
    private _glRenderer$: Observable<SliderGLRenderer>;
    private _glRendererCreator$: Subject<void>;
    private _glRendererDisposer$: Subject<void>;

    private _setKeysSubscription: Subscription;

    private _modeSubcription: Subscription;
    private _stateSubscription: Subscription;
    private _glRenderSubscription: Subscription;
    private _domRenderSubscription: Subscription;
    private _moveSubscription: Subscription;
    private _updateCurtainSubscription: Subscription;
    private _waitSubscription: Subscription;

    private _textureProviderSubscription: Subscription;
    private _setTextureProviderSubscription: Subscription;
    private _setTileSizeSubscription: Subscription;
    private _abortTextureProviderSubscription: Subscription;
    private _setRegionOfInterestSubscription: Subscription;
    private _hasTextureSubscription: Subscription;
    private _updateBackgroundSubscription: Subscription;
    private _updateTextureImageSubscription: Subscription;

    private _textureProviderSubscriptionPrev: Subscription;
    private _setTextureProviderSubscriptionPrev: Subscription;
    private _setTileSizeSubscriptionPrev: Subscription;
    private _abortTextureProviderSubscriptionPrev: Subscription;
    private _setRegionOfInterestSubscriptionPrev: Subscription;
    private _hasTextureSubscriptionPrev: Subscription;
    private _updateBackgroundSubscriptionPrev: Subscription;
    private _updateTextureImageSubscriptionPrev: Subscription;

    /** @ignore */
    constructor (name: string, container: Container, navigator: Navigator, viewportCoords?: ViewportCoords) {
        super(name, container, navigator);

        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();
        this._domRenderer = new SliderDOMRenderer(container);
        this._imageTileLoader = new ImageTileLoader(Urls.tileScheme, Urls.tileDomain, Urls.origin);
        this._roiCalculator = new RegionOfInterestCalculator();
        this._spatial = new Spatial();

        this._glRendererOperation$ = new Subject<IGLRendererOperation>();
        this._glRendererCreator$ = new Subject<void>();
        this._glRendererDisposer$ = new Subject<void>();

        this._glRenderer$ = this._glRendererOperation$.pipe(
            scan(
                (glRenderer: SliderGLRenderer, operation: IGLRendererOperation): SliderGLRenderer => {
                    return operation(glRenderer);
                },
                null),
            filter(
                (glRenderer: SliderGLRenderer): boolean => {
                    return glRenderer != null;
                }),
            distinctUntilChanged(
                undefined,
                (glRenderer: SliderGLRenderer): number => {
                    return glRenderer.frameId;
                }));

        this._glRendererCreator$.pipe(
            map(
                (): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        if (glRenderer != null) {
                            throw new Error("Multiple slider states can not be created at the same time");
                        }

                        return new SliderGLRenderer();
                    };
                }))
            .subscribe(this._glRendererOperation$);

        this._glRendererDisposer$.pipe(
            map(
                (): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        glRenderer.dispose();

                        return null;
                    };
                }))
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

        this._glRenderSubscription = this._glRenderer$.pipe(
            map(
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
                }))
            .subscribe(this._container.glRenderer.render$);

        const position$: Observable<number> = observableConcat(
            this.configuration$.pipe(
                map(
                    (configuration: ISliderConfiguration): number => {
                        return configuration.initialPosition != null ?
                            configuration.initialPosition : 1;
                    }),
                first()),
            this._domRenderer.position$);

        const mode$: Observable<SliderMode> = this.configuration$.pipe(
            map(
                (configuration: ISliderConfiguration): SliderMode => {
                    return configuration.mode;
                }),
            distinctUntilChanged());

        const motionless$: Observable<boolean> = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: IFrame): boolean => {
                    return frame.state.motionless;
                }),
            distinctUntilChanged());

        const fullPano$: Observable<boolean> = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: IFrame): boolean => {
                    return frame.state.currentNode.fullPano;
                }),
            distinctUntilChanged());

        const sliderVisible$: Observable<boolean> = observableCombineLatest(
                this._configuration$.pipe(
                    map(
                        (configuration: ISliderConfiguration): boolean => {
                            return configuration.sliderVisible;
                        })),
                this._navigator.stateService.currentState$.pipe(
                    map(
                        (frame: IFrame): boolean => {
                            return !(frame.state.currentNode == null ||
                                frame.state.previousNode == null ||
                                (frame.state.currentNode.pano && !frame.state.currentNode.fullPano) ||
                                (frame.state.previousNode.pano && !frame.state.previousNode.fullPano) ||
                                (frame.state.currentNode.fullPano && !frame.state.previousNode.fullPano));
                        }),
                    distinctUntilChanged())).pipe(
            map(
                ([sliderVisible, enabledState]: [boolean, boolean]): boolean => {
                    return sliderVisible && enabledState;
                }),
            distinctUntilChanged());

        this._waitSubscription = observableCombineLatest(
                mode$,
                motionless$,
                fullPano$,
                sliderVisible$).pipe(
            withLatestFrom(this._navigator.stateService.state$))
            .subscribe(
                ([[mode, motionless, fullPano, sliderVisible], state]: [[SliderMode, boolean, boolean, boolean], State]): void => {
                    const interactive: boolean = sliderVisible &&
                        (motionless || mode === SliderMode.Stationary || fullPano);

                    if (interactive && state !== State.WaitingInteractively) {
                        this._navigator.stateService.waitInteractively();
                    } else if (!interactive && state !== State.Waiting) {
                        this._navigator.stateService.wait();
                    }
                });

        this._moveSubscription = observableCombineLatest(
                position$,
                mode$,
                motionless$,
                fullPano$,
                sliderVisible$)
            .subscribe(
                ([position, mode, motionless, fullPano, sliderVisible]: [number, SliderMode, boolean, boolean, boolean]): void => {
                    if (motionless || mode === SliderMode.Stationary || fullPano) {
                        this._navigator.stateService.moveTo(1);
                    } else {
                        this._navigator.stateService.moveTo(position);
                    }
                });

        this._domRenderSubscription = observableCombineLatest(
                position$,
                mode$,
                motionless$,
                fullPano$,
                sliderVisible$,
                this._container.renderService.size$).pipe(
            map(
                ([position, mode, motionless, fullPano, sliderVisible, size]:
                    [number, SliderMode, boolean, boolean, boolean, ISize]): IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: this._domRenderer.render(position, mode, motionless, fullPano, sliderVisible),
                    };
                }))
            .subscribe(this._container.domRenderer.render$);

        this._glRendererCreator$.next(null);

        this._updateCurtainSubscription = observableCombineLatest(
                position$,
                fullPano$,
                sliderVisible$,
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$).pipe(
            map(
                ([position, fullPano, visible, render, transform]: [number, boolean, boolean, RenderCamera, Transform]): number => {
                    if (!fullPano) {
                        return visible ? position : 1;
                    }

                    const basicMin: number[] = this._viewportCoords.viewportToBasic(-1.15, 0, transform, render.perspective);
                    const basicMax: number[] = this._viewportCoords.viewportToBasic(1.15, 0, transform, render.perspective);

                    const shiftedMax: number = basicMax[0] < basicMin[0] ? basicMax[0] + 1 : basicMax[0];
                    const basicPosition: number = basicMin[0] + position * (shiftedMax - basicMin[0]);

                    return basicPosition > 1 ? basicPosition - 1 : basicPosition;
                }),
            map(
                (position: number): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        glRenderer.updateCurtain(position);

                        return glRenderer;
                    };
                }))
            .subscribe(this._glRendererOperation$);

        this._stateSubscription = observableCombineLatest(
                this._navigator.stateService.currentState$,
                mode$).pipe(
            map(
                ([frame, mode]: [IFrame, SliderMode]): IGLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        glRenderer.update(frame, mode);

                        return glRenderer;
                    };
                }))
            .subscribe(this._glRendererOperation$);

        this._setKeysSubscription = this._configuration$.pipe(
            filter(
                (configuration: ISliderConfiguration): boolean => {
                    return configuration.keys != null;
                }),
            switchMap(
                (configuration: ISliderConfiguration): Observable<ISliderCombination> => {
                    return observableZip(
                            observableZip(
                                this._catchCacheNode$(configuration.keys.background),
                                this._catchCacheNode$(configuration.keys.foreground)).pipe(
                            map(
                                (nodes: [Node, Node]): ISliderNodes => {
                                    return { background: nodes[0], foreground: nodes[1] };
                                })),
                            this._navigator.stateService.currentState$.pipe(first())).pipe(
                        map(
                            (nf: [ISliderNodes, IFrame]): ISliderCombination => {
                                return { nodes: nf[0], state: nf[1].state };
                            }));
                }))
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

        let previousNode$: Observable<Node> = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: IFrame): Node => {
                    return frame.state.previousNode;
                }),
            filter(
                (node: Node): boolean => {
                    return node != null;
                }),
            distinctUntilChanged(
                undefined,
                (node: Node): string => {
                    return node.key;
                }));

        const textureProvider$: Observable<TextureProvider> = this._navigator.stateService.currentState$.pipe(
            distinctUntilChanged(
                undefined,
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                }),
            withLatestFrom(
                this._container.glRenderer.webGLRenderer$,
                this._container.renderService.size$),
            map(
                ([frame, renderer, size]: [IFrame, THREE.WebGLRenderer, ISize]): TextureProvider => {
                    const state: ICurrentState = frame.state;
                    const viewportSize: number = Math.max(size.width, size.height);

                    const currentNode: Node = state.currentNode;
                    const currentTransform: Transform = state.currentTransform;
                    const tileSize: number = viewportSize > 2048 ? 2048 : viewportSize > 1024 ? 1024 : 512;

                    return new TextureProvider(
                        currentNode.key,
                        currentTransform.basicWidth,
                        currentTransform.basicHeight,
                        tileSize,
                        currentNode.image,
                        this._imageTileLoader,
                        new ImageTileStore(),
                        renderer);
                }),
            publishReplay(1),
            refCount());

        this._textureProviderSubscription = textureProvider$.subscribe(() => { /*noop*/ });

        this._setTextureProviderSubscription = textureProvider$.pipe(
            map(
                (provider: TextureProvider): IGLRendererOperation => {
                    return (renderer: SliderGLRenderer): SliderGLRenderer => {
                        renderer.setTextureProvider(provider.key, provider);

                        return renderer;
                    };
                }))
            .subscribe(this._glRendererOperation$);

        this._setTileSizeSubscription = this._container.renderService.size$.pipe(
            switchMap(
                (size: ISize): Observable<[TextureProvider, ISize]> => {
                    return observableCombineLatest(
                            textureProvider$,
                            observableOf<ISize>(size)).pipe(
                        first());
                }))
            .subscribe(
                ([provider, size]: [TextureProvider, ISize]): void => {
                    let viewportSize: number = Math.max(size.width, size.height);
                    let tileSize: number = viewportSize > 2048 ? 2048 : viewportSize > 1024 ? 1024 : 512;

                    provider.setTileSize(tileSize);
                });

        this._abortTextureProviderSubscription = textureProvider$.pipe(
            pairwise())
            .subscribe(
                (pair: [TextureProvider, TextureProvider]): void => {
                    let previous: TextureProvider = pair[0];
                    previous.abort();
                });

        let roiTrigger$: Observable<[RenderCamera, ISize, Transform]> = observableCombineLatest(
                this._container.renderService.renderCameraFrame$,
                this._container.renderService.size$.pipe(debounceTime(250))).pipe(
            map(
                ([camera, size]: [RenderCamera, ISize]): PositionLookat => {
                    return [
                        camera.camera.position.clone(),
                        camera.camera.lookat.clone(),
                        camera.zoom.valueOf(),
                        size.height.valueOf(),
                        size.width.valueOf()];
                }),
            pairwise(),
            skipWhile(
                (pls: [PositionLookat, PositionLookat]): boolean => {
                    return pls[1][2] - pls[0][2] < 0 || pls[1][2] === 0;
                }),
            map(
                (pls: [PositionLookat, PositionLookat]): boolean => {
                    let samePosition: boolean = pls[0][0].equals(pls[1][0]);
                    let sameLookat: boolean = pls[0][1].equals(pls[1][1]);
                    let sameZoom: boolean = pls[0][2] === pls[1][2];
                    let sameHeight: boolean = pls[0][3] === pls[1][3];
                    let sameWidth: boolean = pls[0][4] === pls[1][4];

                    return samePosition && sameLookat && sameZoom && sameHeight && sameWidth;
                }),
            distinctUntilChanged(),
            filter(
                (stalled: boolean): boolean => {
                    return stalled;
                }),
            switchMap(
                (stalled: boolean): Observable<RenderCamera> => {
                    return this._container.renderService.renderCameraFrame$.pipe(
                        first());
                }),
            withLatestFrom(
                this._container.renderService.size$,
                this._navigator.stateService.currentTransform$));

        this._setRegionOfInterestSubscription = textureProvider$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<[IRegionOfInterest, TextureProvider]> => {
                    return roiTrigger$.pipe(
                        map(
                            ([camera, size, transform]: [RenderCamera, ISize, Transform]):
                            [IRegionOfInterest, TextureProvider] => {
                                return [
                                    this._roiCalculator.computeRegionOfInterest(camera, size, transform),
                                    provider,
                                ];
                            }));
                }),
            filter(
                (args: [IRegionOfInterest, TextureProvider]): boolean => {
                    return !args[1].disposed;
                }))
            .subscribe(
                (args: [IRegionOfInterest, TextureProvider]): void => {
                    let roi: IRegionOfInterest = args[0];
                    let provider: TextureProvider = args[1];

                    provider.setRegionOfInterest(roi);
                });

        let hasTexture$: Observable<boolean> = textureProvider$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<boolean> => {
                    return provider.hasTexture$;
                }),
            startWith(false),
            publishReplay(1),
            refCount());

        this._hasTextureSubscription = hasTexture$.subscribe(() => { /*noop*/ });

        let nodeImage$: Observable<[HTMLImageElement, Node]> = this._navigator.stateService.currentState$.pipe(
            filter(
                (frame: IFrame): boolean => {
                    return frame.state.nodesAhead === 0;
                }),
            map(
                (frame: IFrame): Node => {
                    return frame.state.currentNode;
                }),
            distinctUntilChanged(
                undefined,
                (node: Node): string => {
                    return node.key;
                }),
            debounceTime(1000),
            withLatestFrom(hasTexture$),
            filter(
                (args: [Node, boolean]): boolean => {
                    return !args[1];
                }),
            map(
                (args: [Node, boolean]): Node => {
                    return args[0];
                }),
            filter(
                (node: Node): boolean => {
                    return node.pano ?
                        Settings.maxImageSize > Settings.basePanoramaSize :
                        Settings.maxImageSize > Settings.baseImageSize;
                }),
            switchMap(
                (node: Node): Observable<[HTMLImageElement, Node]> => {
                    let baseImageSize: ImageSize = node.pano ?
                        Settings.basePanoramaSize :
                        Settings.baseImageSize;

                    if (Math.max(node.image.width, node.image.height) > baseImageSize) {
                        return observableEmpty();
                    }

                    let image$: Observable<[HTMLImageElement, Node]> = node
                        .cacheImage$(Settings.maxImageSize).pipe(
                            map(
                                (n: Node): [HTMLImageElement, Node] => {
                                    return [n.image, n];
                                }));

                    return image$.pipe(
                        takeUntil(
                            hasTexture$.pipe(
                                filter(
                                    (hasTexture: boolean): boolean => {

                                        return hasTexture;
                                    }))),
                        catchError(
                            (error: Error, caught: Observable<[HTMLImageElement, Node]>):
                                Observable<[HTMLImageElement, Node]> => {
                                console.error(`Failed to fetch high res image (${node.key})`, error);

                                return observableEmpty();
                            }));
                })).pipe(
            publish(),
            refCount());

        this._updateBackgroundSubscription = nodeImage$.pipe(
            withLatestFrom(textureProvider$))
            .subscribe(
                (args: [[HTMLImageElement, Node], TextureProvider]): void => {
                    if (args[0][1].key !== args[1].key ||
                        args[1].disposed) {
                        return;
                    }

                    args[1].updateBackground(args[0][0]);
                });

        this._updateTextureImageSubscription = nodeImage$.pipe(
            map(
                (imn: [HTMLImageElement, Node]): IGLRendererOperation => {
                    return (renderer: SliderGLRenderer): SliderGLRenderer => {
                        renderer.updateTextureImage(imn[0], imn[1]);

                        return renderer;
                    };
                }))
            .subscribe(this._glRendererOperation$);

        const textureProviderPrev$: Observable<TextureProvider> = this._navigator.stateService.currentState$.pipe(
            filter(
                (frame: IFrame): boolean => {
                    return !!frame.state.previousNode;
                }),
            distinctUntilChanged(
                undefined,
                (frame: IFrame): string => {
                    return frame.state.previousNode.key;
                }),
            withLatestFrom(
                this._container.glRenderer.webGLRenderer$,
                this._container.renderService.size$),
            map(
                ([frame, renderer, size]: [IFrame, THREE.WebGLRenderer, ISize]): TextureProvider => {
                    const state: ICurrentState = frame.state;
                    const viewportSize: number = Math.max(size.width, size.height);

                    const previousNode: Node = state.previousNode;
                    const previousTransform: Transform = state.previousTransform;
                    const tileSize: number = viewportSize > 2048 ? 2048 : viewportSize > 1024 ? 1024 : 512;

                    return new TextureProvider(
                        previousNode.key,
                        previousTransform.basicWidth,
                        previousTransform.basicHeight,
                        tileSize,
                        previousNode.image,
                        this._imageTileLoader,
                        new ImageTileStore(),
                        renderer);
                }),
            publishReplay(1),
            refCount());

        this._textureProviderSubscriptionPrev = textureProviderPrev$.subscribe(() => { /*noop*/ });

        this._setTextureProviderSubscriptionPrev = textureProviderPrev$.pipe(
            map(
                (provider: TextureProvider): IGLRendererOperation => {
                    return (renderer: SliderGLRenderer): SliderGLRenderer => {
                        renderer.setTextureProviderPrev(provider.key, provider);

                        return renderer;
                    };
                }))
            .subscribe(this._glRendererOperation$);

        this._setTileSizeSubscriptionPrev = this._container.renderService.size$.pipe(
            switchMap(
                (size: ISize): Observable<[TextureProvider, ISize]> => {
                    return observableCombineLatest(
                            textureProviderPrev$,
                            observableOf<ISize>(size)).pipe(
                        first());
                }))
            .subscribe(
                ([provider, size]: [TextureProvider, ISize]): void => {
                    let viewportSize: number = Math.max(size.width, size.height);
                    let tileSize: number = viewportSize > 2048 ? 2048 : viewportSize > 1024 ? 1024 : 512;

                    provider.setTileSize(tileSize);
                });

        this._abortTextureProviderSubscriptionPrev = textureProviderPrev$.pipe(
            pairwise())
            .subscribe(
                (pair: [TextureProvider, TextureProvider]): void => {
                    let previous: TextureProvider = pair[0];
                    previous.abort();
                });

        let roiTriggerPrev$: Observable<[RenderCamera, ISize, Transform]> = observableCombineLatest(
                this._container.renderService.renderCameraFrame$,
                this._container.renderService.size$.pipe(debounceTime(250))).pipe(
            map(
                ([camera, size]: [RenderCamera, ISize]): PositionLookat => {
                    return [
                        camera.camera.position.clone(),
                        camera.camera.lookat.clone(),
                        camera.zoom.valueOf(),
                        size.height.valueOf(),
                        size.width.valueOf()];
                }),
            pairwise(),
            skipWhile(
                (pls: [PositionLookat, PositionLookat]): boolean => {
                    return pls[1][2] - pls[0][2] < 0 || pls[1][2] === 0;
                }),
            map(
                (pls: [PositionLookat, PositionLookat]): boolean => {
                    let samePosition: boolean = pls[0][0].equals(pls[1][0]);
                    let sameLookat: boolean = pls[0][1].equals(pls[1][1]);
                    let sameZoom: boolean = pls[0][2] === pls[1][2];
                    let sameHeight: boolean = pls[0][3] === pls[1][3];
                    let sameWidth: boolean = pls[0][4] === pls[1][4];

                    return samePosition && sameLookat && sameZoom && sameHeight && sameWidth;
                }),
            distinctUntilChanged(),
            filter(
                (stalled: boolean): boolean => {
                    return stalled;
                }),
            switchMap(
                (stalled: boolean): Observable<RenderCamera> => {
                    return this._container.renderService.renderCameraFrame$.pipe(
                        first());
                }),
            withLatestFrom(
                this._container.renderService.size$,
                this._navigator.stateService.currentTransform$));

        this._setRegionOfInterestSubscriptionPrev = textureProviderPrev$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<[IRegionOfInterest, TextureProvider]> => {
                    return roiTriggerPrev$.pipe(
                        map(
                            ([camera, size, transform]: [RenderCamera, ISize, Transform]):
                            [IRegionOfInterest, TextureProvider] => {
                                return [
                                    this._roiCalculator.computeRegionOfInterest(camera, size, transform),
                                    provider,
                                ];
                            }));
                }),
            filter(
                (args: [IRegionOfInterest, TextureProvider]): boolean => {
                    return !args[1].disposed;
                }),
            withLatestFrom(this._navigator.stateService.currentState$))
            .subscribe(
                ([[roi, provider], frame]: [[IRegionOfInterest, TextureProvider], IFrame]): void => {
                    let shiftedRoi: IRegionOfInterest = null;

                    if (frame.state.previousNode.fullPano) {
                        if (frame.state.currentNode.fullPano) {
                            const currentViewingDirection: THREE.Vector3 =
                                this._spatial.viewingDirection(frame.state.currentNode.rotation);
                            const previousViewingDirection: THREE.Vector3 =
                                this._spatial.viewingDirection(frame.state.previousNode.rotation);

                            const directionDiff: number = this._spatial.angleBetweenVector2(
                                currentViewingDirection.x,
                                currentViewingDirection.y,
                                previousViewingDirection.x,
                                previousViewingDirection.y);

                            const shift: number = directionDiff / (2 * Math.PI);

                            const bbox: IBoundingBox = {
                                maxX: this._spatial.wrap(roi.bbox.maxX + shift, 0, 1),
                                maxY: roi.bbox.maxY,
                                minX: this._spatial.wrap(roi.bbox.minX + shift, 0, 1),
                                minY: roi.bbox.minY,
                            };

                            shiftedRoi = {
                                bbox: bbox,
                                pixelHeight: roi.pixelHeight,
                                pixelWidth: roi.pixelWidth,
                            };
                        } else {
                            const currentViewingDirection: THREE.Vector3 =
                                this._spatial.viewingDirection(frame.state.currentNode.rotation);
                            const previousViewingDirection: THREE.Vector3 =
                                this._spatial.viewingDirection(frame.state.previousNode.rotation);

                            const directionDiff: number = this._spatial.angleBetweenVector2(
                                currentViewingDirection.x,
                                currentViewingDirection.y,
                                previousViewingDirection.x,
                                previousViewingDirection.y);

                            const shiftX: number = directionDiff / (2 * Math.PI);

                            const a1: number = this._spatial.angleToPlane(currentViewingDirection.toArray(), [0, 0, 1]);
                            const a2: number = this._spatial.angleToPlane(previousViewingDirection.toArray(), [0, 0, 1]);

                            const shiftY: number = (a2 - a1) / (2 * Math.PI);

                            const currentTransform: Transform = frame.state.currentTransform;
                            const size: number = Math.max(currentTransform.basicWidth, currentTransform.basicHeight);
                            const hFov: number = size > 0 ?
                                2 * Math.atan(0.5 * currentTransform.basicWidth / (size * currentTransform.focal)) :
                                Math.PI / 3;
                            const vFov: number = size > 0 ?
                                2 * Math.atan(0.5 * currentTransform.basicHeight / (size * currentTransform.focal)) :
                                Math.PI / 3;

                            const spanningWidth: number = hFov / (2 * Math.PI);
                            const spanningHeight: number = vFov / Math.PI;

                            const basicWidth: number = (roi.bbox.maxX - roi.bbox.minX) * spanningWidth;
                            const basicHeight: number = (roi.bbox.maxY - roi.bbox.minY) * spanningHeight;

                            const pixelWidth: number = roi.pixelWidth * spanningWidth;
                            const pixelHeight: number = roi.pixelHeight * spanningHeight;

                            const zoomShiftX: number = (roi.bbox.minX + roi.bbox.maxX) / 2 - 0.5;
                            const zoomShiftY: number = (roi.bbox.minY + roi.bbox.maxY) / 2 - 0.5;

                            const minX: number = 0.5 + shiftX + spanningWidth * zoomShiftX - basicWidth / 2;
                            const maxX: number = 0.5 + shiftX + spanningWidth * zoomShiftX + basicWidth / 2;
                            const minY: number = 0.5 + shiftY + spanningHeight * zoomShiftY - basicHeight / 2;
                            const maxY: number = 0.5 + shiftY + spanningHeight * zoomShiftY + basicHeight / 2;

                            const bbox: IBoundingBox = {
                                maxX: this._spatial.wrap(maxX, 0, 1),
                                maxY: maxY,
                                minX: this._spatial.wrap(minX, 0, 1),
                                minY: minY,
                            };

                            shiftedRoi = {
                                bbox: bbox,
                                pixelHeight: pixelHeight,
                                pixelWidth: pixelWidth,
                            };
                        }
                    } else {
                        const currentBasicAspect: number = frame.state.currentTransform.basicAspect;
                        const previousBasicAspect: number = frame.state.previousTransform.basicAspect;

                        const [[cornerMinX, cornerMinY], [cornerMaxX, cornerMaxY]]: number[][] =
                            this._getBasicCorners(currentBasicAspect, previousBasicAspect);

                        const basicWidth: number = cornerMaxX - cornerMinX;
                        const basicHeight: number = cornerMaxY - cornerMinY;

                        const pixelWidth: number = roi.pixelWidth / basicWidth;
                        const pixelHeight: number = roi.pixelHeight / basicHeight;

                        const minX: number = (basicWidth - 1) / (2 * basicWidth) + roi.bbox.minX / basicWidth;
                        const maxX: number = (basicWidth - 1) / (2 * basicWidth) + roi.bbox.maxX / basicWidth;
                        const minY: number = (basicHeight - 1) / (2 * basicHeight) + roi.bbox.minY / basicHeight;
                        const maxY: number = (basicHeight - 1) / (2 * basicHeight) + roi.bbox.maxY / basicHeight;

                        const bbox: IBoundingBox = {
                            maxX: maxX,
                            maxY: maxY,
                            minX: minX,
                            minY: minY,
                        };

                        this._clipBoundingBox(bbox);

                        shiftedRoi = {
                            bbox: bbox,
                            pixelHeight: pixelHeight,
                            pixelWidth: pixelWidth,
                        };
                    }

                    provider.setRegionOfInterest(shiftedRoi);
                });

        let hasTexturePrev$: Observable<boolean> = textureProviderPrev$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<boolean> => {
                    return provider.hasTexture$;
                }),
            startWith(false),
            publishReplay(1),
            refCount());

        this._hasTextureSubscriptionPrev = hasTexturePrev$.subscribe(() => { /*noop*/ });

        let nodeImagePrev$: Observable<[HTMLImageElement, Node]> = this._navigator.stateService.currentState$.pipe(
            filter(
                (frame: IFrame): boolean => {
                    return frame.state.nodesAhead === 0 && !!frame.state.previousNode;
                }),
            map(
                (frame: IFrame): Node => {
                    return frame.state.previousNode;
                }),
            distinctUntilChanged(
                undefined,
                (node: Node): string => {
                    return node.key;
                }),
            debounceTime(1000),
            withLatestFrom(hasTexturePrev$),
            filter(
                (args: [Node, boolean]): boolean => {
                    return !args[1];
                }),
            map(
                (args: [Node, boolean]): Node => {
                    return args[0];
                }),
            filter(
                (node: Node): boolean => {
                    return node.pano ?
                        Settings.maxImageSize > Settings.basePanoramaSize :
                        Settings.maxImageSize > Settings.baseImageSize;
                }),
            switchMap(
                (node: Node): Observable<[HTMLImageElement, Node]> => {
                    let baseImageSize: ImageSize = node.pano ?
                        Settings.basePanoramaSize :
                        Settings.baseImageSize;

                    if (Math.max(node.image.width, node.image.height) > baseImageSize) {
                        return observableEmpty();
                    }

                    let image$: Observable<[HTMLImageElement, Node]> = node
                        .cacheImage$(Settings.maxImageSize).pipe(
                            map(
                                (n: Node): [HTMLImageElement, Node] => {
                                    return [n.image, n];
                                }));

                    return image$.pipe(
                        takeUntil(
                            hasTexturePrev$.pipe(
                                filter(
                                    (hasTexture: boolean): boolean => {

                                        return hasTexture;
                                    }))),
                        catchError(
                            (error: Error, caught: Observable<[HTMLImageElement, Node]>):
                                Observable<[HTMLImageElement, Node]> => {
                                console.error(`Failed to fetch high res image (${node.key})`, error);

                                return observableEmpty();
                            }));
                })).pipe(
            publish(),
            refCount());

        this._updateBackgroundSubscriptionPrev = nodeImagePrev$.pipe(
            withLatestFrom(textureProviderPrev$))
            .subscribe(
                (args: [[HTMLImageElement, Node], TextureProvider]): void => {
                    if (args[0][1].key !== args[1].key ||
                        args[1].disposed) {
                        return;
                    }

                    args[1].updateBackground(args[0][0]);
                });

        this._updateTextureImageSubscriptionPrev = nodeImagePrev$.pipe(
            map(
                (imn: [HTMLImageElement, Node]): IGLRendererOperation => {
                    return (renderer: SliderGLRenderer): SliderGLRenderer => {
                        renderer.updateTextureImage(imn[0], imn[1]);

                        return renderer;
                    };
                }))
            .subscribe(this._glRendererOperation$);
    }

    protected _deactivate(): void {
        this._waitSubscription.unsubscribe();

        this._navigator.stateService.state$.pipe(
            first())
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
        this._moveSubscription.unsubscribe();
        this._updateCurtainSubscription.unsubscribe();

        this._textureProviderSubscription.unsubscribe();
        this._setTextureProviderSubscription.unsubscribe();
        this._setTileSizeSubscription.unsubscribe();
        this._abortTextureProviderSubscription.unsubscribe();
        this._setRegionOfInterestSubscription.unsubscribe();
        this._hasTextureSubscription.unsubscribe();
        this._updateBackgroundSubscription.unsubscribe();
        this._updateTextureImageSubscription.unsubscribe();

        this._textureProviderSubscriptionPrev.unsubscribe();
        this._setTextureProviderSubscriptionPrev.unsubscribe();
        this._setTileSizeSubscriptionPrev.unsubscribe();
        this._abortTextureProviderSubscriptionPrev.unsubscribe();
        this._setRegionOfInterestSubscriptionPrev.unsubscribe();
        this._hasTextureSubscriptionPrev.unsubscribe();
        this._updateBackgroundSubscriptionPrev.unsubscribe();
        this._updateTextureImageSubscriptionPrev.unsubscribe();

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
        return this._navigator.graphService.cacheNode$(key).pipe(
            catchError(
                (error: Error, caught: Observable<Node>): Observable<Node> => {
                    console.error(`Failed to cache slider node (${key})`, error);

                    return observableEmpty();
                }));
    }

    private _getBasicCorners(currentAspect: number, previousAspect: number): number[][] {
        let offsetX: number;
        let offsetY: number;

        if (currentAspect > previousAspect) {
            offsetX = 0.5;
            offsetY = 0.5 * currentAspect / previousAspect;
        } else {
            offsetX = 0.5 * previousAspect / currentAspect;
            offsetY = 0.5;
        }

        return [[0.5 - offsetX, 0.5 - offsetY], [0.5 + offsetX, 0.5 + offsetY]];
    }

    private _clipBoundingBox(bbox: IBoundingBox): void {
        bbox.minX = Math.max(0, Math.min(1, bbox.minX));
        bbox.maxX = Math.max(0, Math.min(1, bbox.maxX));
        bbox.minY = Math.max(0, Math.min(1, bbox.minY));
        bbox.maxY = Math.max(0, Math.min(1, bbox.maxY));
    }
}

ComponentService.register(SliderComponent);
export default SliderComponent;
