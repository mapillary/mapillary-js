import {
    empty as observableEmpty,
    of as observableOf,
    combineLatest as observableCombineLatest,
    Observable,
    Subscription,
    Subject,
} from "rxjs";

import {
    switchMap,
    pairwise,
    debounceTime,
    refCount,
    publishReplay,
    withLatestFrom,
    scan,
    filter,
    first,
    catchError,
    takeUntil,
    startWith,
    skipWhile,
    map,
    publish,
    distinctUntilChanged,
} from "rxjs/operators";

import {
    ComponentService,
    Component,
    IComponentConfiguration,
    ImagePlaneGLRenderer,
} from "../../Component";
import {
    Transform,
} from "../../Geo";
import {
    ICurrentState,
    IFrame,
} from "../../State";
import {
    Container,
    Navigator,
    ImageSize,
} from "../../Viewer";
import {
    GLRenderStage,
    IGLRenderHash,
    ISize,
    RenderCamera,
} from "../../Render";
import {Node as GraphNode} from "../../Graph";
import {
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

interface IImagePlaneGLRendererOperation {
    (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer;
}

type PositionLookat = [THREE.Vector3, THREE.Vector3, number, number, number];

export class ImagePlaneComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "imagePlane";

    private _rendererOperation$: Subject<IImagePlaneGLRendererOperation>;
    private _renderer$: Observable<ImagePlaneGLRenderer>;
    private _rendererCreator$: Subject<void>;
    private _rendererDisposer$: Subject<void>;

    private _abortTextureProviderSubscription: Subscription;
    private _hasTextureSubscription: Subscription;
    private _rendererSubscription: Subscription;
    private _setRegionOfInterestSubscription: Subscription;
    private _setTextureProviderSubscription: Subscription;
    private _setTileSizeSubscription: Subscription;
    private _stateSubscription: Subscription;
    private _textureProviderSubscription: Subscription;
    private _updateBackgroundSubscription: Subscription;
    private _updateTextureImageSubscription: Subscription;

    private _imageTileLoader: ImageTileLoader;
    private _roiCalculator: RegionOfInterestCalculator;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._imageTileLoader = new ImageTileLoader(Urls.tileScheme, Urls.tileDomain, Urls.origin);
        this._roiCalculator = new RegionOfInterestCalculator();

        this._rendererOperation$ = new Subject<IImagePlaneGLRendererOperation>();
        this._rendererCreator$ = new Subject<void>();
        this._rendererDisposer$ = new Subject<void>();

        this._renderer$ = this._rendererOperation$.pipe(
            scan(
                (renderer: ImagePlaneGLRenderer, operation: IImagePlaneGLRendererOperation): ImagePlaneGLRenderer => {
                    return operation(renderer);
                },
                null),
            filter(
                (renderer: ImagePlaneGLRenderer): boolean => {
                    return renderer != null;
                }),
            distinctUntilChanged(
                undefined,
                (renderer: ImagePlaneGLRenderer): number => {
                    return renderer.frameId;
                }));

        this._rendererCreator$.pipe(
            map(
                (): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        if (renderer != null) {
                            throw new Error("Multiple image plane states can not be created at the same time");
                        }

                        return new ImagePlaneGLRenderer();
                    };
                }))
            .subscribe(this._rendererOperation$);

        this._rendererDisposer$.pipe(
            map(
                (): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.dispose();

                        return null;
                    };
                }))
            .subscribe(this._rendererOperation$);
    }

    protected _activate(): void {
        this._rendererSubscription = this._renderer$.pipe(
            map(
                (renderer: ImagePlaneGLRenderer): IGLRenderHash => {
                    let renderHash: IGLRenderHash = {
                        name: this._name,
                        render: {
                            frameId: renderer.frameId,
                            needsRender: renderer.needsRender,
                            render: renderer.render.bind(renderer),
                            stage: GLRenderStage.Background,
                        },
                    };

                    renderer.clearNeedsRender();

                    return renderHash;
                }))
            .subscribe(this._container.glRenderer.render$);

        this._rendererCreator$.next(null);

        this._stateSubscription = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: IFrame): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateFrame(frame);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);

        let textureProvider$: Observable<TextureProvider> = this._navigator.stateService.currentState$.pipe(
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
                    let state: ICurrentState = frame.state;
                    let viewportSize: number = Math.max(size.width, size.height);

                    let currentNode: GraphNode = state.currentNode;
                    let currentTransform: Transform = state.currentTransform;
                    let tileSize: number = viewportSize > 2048 ? 2048 : viewportSize > 1024 ? 1024 : 512;

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
                (provider: TextureProvider): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.setTextureProvider(provider.key, provider);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);

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

        let nodeImage$: Observable<[HTMLImageElement, GraphNode]> = this._navigator.stateService.currentState$.pipe(
            filter(
                (frame: IFrame): boolean => {
                    return frame.state.nodesAhead === 0;
                }),
            map(
                (frame: IFrame): GraphNode => {
                    return frame.state.currentNode;
                }),
            distinctUntilChanged(
                undefined,
                (node: GraphNode): string => {
                    return node.key;
                }),
            debounceTime(1000),
            withLatestFrom(hasTexture$),
            filter(
                (args: [GraphNode, boolean]): boolean => {
                    return !args[1];
                }),
            map(
                (args: [GraphNode, boolean]): GraphNode => {
                    return args[0];
                }),
            filter(
                (node: GraphNode): boolean => {
                    return node.pano ?
                        Settings.maxImageSize > Settings.basePanoramaSize :
                        Settings.maxImageSize > Settings.baseImageSize;
                }),
            switchMap(
                (node: GraphNode): Observable<[HTMLImageElement, GraphNode]> => {
                    let baseImageSize: ImageSize = node.pano ?
                        Settings.basePanoramaSize :
                        Settings.baseImageSize;

                    if (Math.max(node.image.width, node.image.height) > baseImageSize) {
                        return observableEmpty();
                    }

                    let image$: Observable<[HTMLImageElement, GraphNode]> = node
                        .cacheImage$(Settings.maxImageSize).pipe(
                            map(
                                (n: GraphNode): [HTMLImageElement, GraphNode] => {
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
                            (error: Error, caught: Observable<[HTMLImageElement, GraphNode]>):
                                Observable<[HTMLImageElement, GraphNode]> => {
                                console.error(`Failed to fetch high res image (${node.key})`, error);

                                return observableEmpty();
                            }));
                })).pipe(
            publish(),
            refCount());

        this._updateBackgroundSubscription = nodeImage$.pipe(
            withLatestFrom(textureProvider$))
            .subscribe(
                (args: [[HTMLImageElement, GraphNode], TextureProvider]): void => {
                    if (args[0][1].key !== args[1].key ||
                        args[1].disposed) {
                        return;
                    }

                    args[1].updateBackground(args[0][0]);
                });

        this._updateTextureImageSubscription = nodeImage$.pipe(
            map(
                (imn: [HTMLImageElement, GraphNode]): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateTextureImage(imn[0], imn[1]);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);
    }

    protected _deactivate(): void {
        this._rendererDisposer$.next(null);

        this._abortTextureProviderSubscription.unsubscribe();
        this._hasTextureSubscription.unsubscribe();
        this._rendererSubscription.unsubscribe();
        this._setRegionOfInterestSubscription.unsubscribe();
        this._setTextureProviderSubscription.unsubscribe();
        this._setTileSizeSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
        this._textureProviderSubscription.unsubscribe();
        this._updateBackgroundSubscription.unsubscribe();
        this._updateTextureImageSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return { };
    }
}

ComponentService.register(ImagePlaneComponent);
export default ImagePlaneComponent;
