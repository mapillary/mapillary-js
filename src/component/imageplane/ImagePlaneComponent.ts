import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/of";

import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/withLatestFrom";

import {
    ComponentService,
    Component,
    IImagePlaneConfiguration,
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
} from "../../Render";
import {Node} from "../../Graph";
import {
    ImageTileLoader,
    ImageTileStore,
    IRegionOfInterest,
    RegionOfInterestService,
    TextureProvider,
} from "../../Tiles";
import {
    Settings,
    Urls,
} from "../../Utils";

interface IImagePlaneGLRendererOperation {
    (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer;
}

type TileHandler = {
    key: string;
    provider: TextureProvider;
    roiService: RegionOfInterestService;
}

export class ImagePlaneComponent extends Component<IImagePlaneConfiguration> {
    public static componentName: string = "imagePlane";

    private _rendererOperation$: Subject<IImagePlaneGLRendererOperation>;
    private _renderer$: Observable<ImagePlaneGLRenderer>;
    private _rendererCreator$: Subject<void>;
    private _rendererDisposer$: Subject<void>;

    private _rendererSubscription: Subscription;
    private _stateSubscription: Subscription;

    private _imageTileLoader: ImageTileLoader;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._imageTileLoader = new ImageTileLoader(Urls.tileDomain, Urls.origin);

        this._rendererOperation$ = new Subject<IImagePlaneGLRendererOperation>();
        this._rendererCreator$ = new Subject<void>();
        this._rendererDisposer$ = new Subject<void>();

        this._renderer$ = this._rendererOperation$
            .scan<ImagePlaneGLRenderer>(
                (renderer: ImagePlaneGLRenderer, operation: IImagePlaneGLRendererOperation): ImagePlaneGLRenderer => {
                    return operation(renderer);
                },
                null)
            .filter(
                (renderer: ImagePlaneGLRenderer): boolean => {
                    return renderer != null;
                })
            .distinctUntilChanged(
                undefined,
                (renderer: ImagePlaneGLRenderer): number => {
                    return renderer.frameId;
                });

        this._rendererCreator$
            .map<IImagePlaneGLRendererOperation>(
                (): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        if (renderer != null) {
                            throw new Error("Multiple image plane states can not be created at the same time");
                        }

                        return new ImagePlaneGLRenderer();
                    };
                })
            .subscribe(this._rendererOperation$);

        this._rendererDisposer$
            .map<IImagePlaneGLRendererOperation>(
                (): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.dispose();

                        return null;
                    };
                })
            .subscribe(this._rendererOperation$);
    }

    protected _activate(): void {
        this._rendererSubscription = this._renderer$
            .map<IGLRenderHash>(
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
                })
            .subscribe(this._container.glRenderer.render$);

        this._rendererCreator$.next(null);

        this._stateSubscription = this._navigator.stateService.currentState$
            .map<IImagePlaneGLRendererOperation>(
                (frame: IFrame): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateFrame(frame);

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);

        let tileHandler$: Observable<TileHandler> = this._navigator.stateService.currentState$
            .distinctUntilChanged(
                undefined,
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                })
            .combineLatest(this._configuration$)
            .filter(
                (args: [IFrame, IImagePlaneConfiguration]): boolean => {
                    return args[1].imageTiling === true;
                })
            .map(
                (args: [IFrame, IImagePlaneConfiguration]): IFrame => {
                    return args[0];
                })
            .withLatestFrom(
                this._container.glRenderer.webGLRenderer$,
                this._container.renderService.size$)
            .map(
                (args: [IFrame, THREE.WebGLRenderer, ISize]): TileHandler => {
                    let state: ICurrentState = args[0].state;
                    let renderer: THREE.WebGLRenderer = args[1];
                    let viewportSize: ISize = args[2];

                    let currentTransform: Transform = state.currentTransform;

                    let roiService: RegionOfInterestService =
                        new RegionOfInterestService(this._container.renderService, state.currentTransform);

                    let currentNode: Node = state.currentNode;
                    let tileSize: number = Math.max(viewportSize.width, viewportSize.height) > 1024 ? 1024 : 512;

                    let textureProvider: TextureProvider =
                        new TextureProvider(
                            currentNode.key,
                            currentTransform.basicWidth,
                            currentTransform.basicHeight,
                            tileSize,
                            currentNode.image,
                            this._imageTileLoader,
                            new ImageTileStore(),
                            renderer);

                    return {
                        key: currentNode.key,
                        provider: textureProvider,
                        roiService: roiService,
                    };
                })
            .publishReplay(1)
            .refCount();

        tileHandler$.subscribe();

        tileHandler$
            .map<IImagePlaneGLRendererOperation>(
                (handler: TileHandler): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.setTextureProvider(handler.key, handler.provider);

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);

        tileHandler$
            .pairwise()
            .subscribe(
                (pair: [TileHandler, TileHandler]): void => {
                    let previous: TextureProvider = pair[0].provider;
                    previous.abort();
                });

        tileHandler$
            .switchMap(
                (handler: TileHandler): Observable<[IRegionOfInterest, TextureProvider]> => {
                    return Observable
                        .combineLatest(
                            handler.roiService.roi$,
                            Observable.of(handler.provider));
                })
            .filter(
                (args: [IRegionOfInterest, TextureProvider]): boolean => {
                    return !args[1].disposed;
                }
            )
            .subscribe(
                (args: [IRegionOfInterest, TextureProvider]): void => {
                    let roi: IRegionOfInterest = args[0];
                    let provider: TextureProvider = args[1];

                    provider.setRegionOfInterest(roi);
                });

        let hasTexture$: Observable<boolean> = tileHandler$
            .switchMap(
                (handler: TileHandler): Observable<boolean> => {
                    return handler.provider.hasTexture$;
                })
            .startWith(false)
            .publishReplay(1)
            .refCount();

        hasTexture$.subscribe();

        let nodeImage$: Observable<[HTMLImageElement, Node]> = this._navigator.stateService.currentNode$
            .debounceTime(1000)
            .withLatestFrom(hasTexture$)
            .filter(
                (args: [Node, boolean]): boolean => {
                    return !args[1];
                })
            .map(
                (args: [Node, boolean]): Node => {
                    return args[0];
                })
            .filter(
                (node: Node): boolean => {
                    return node.pano ?
                        Settings.maxImageSize > Settings.basePanoramaSize :
                        Settings.maxImageSize > Settings.baseImageSize;
                })
            .switchMap<[HTMLImageElement, Node]>(
                (node: Node): Observable<[HTMLImageElement, Node]> => {
                    let baseImageSize: ImageSize = node.pano ?
                        Settings.basePanoramaSize :
                        Settings.baseImageSize;

                    if (Math.max(node.image.width, node.image.height) > baseImageSize) {
                        return Observable.empty<[HTMLImageElement, Node]>();
                    }

                    let image$: Observable<[HTMLImageElement, Node]> = node
                        .cacheImage$(Settings.maxImageSize)
                            .map<[HTMLImageElement, Node]>(
                                (n: Node): [HTMLImageElement, Node] => {
                                    return [n.image, n];
                                });

                    return image$
                        .takeUntil(
                            hasTexture$
                                .filter(
                                    (hasTexture: boolean): boolean => {

                                        return hasTexture;
                                    }))
                        .catch(
                            (error: Error, caught: Observable<[HTMLImageElement, Node]>):
                                Observable<[HTMLImageElement, Node]> => {
                                console.error(`Failed to fetch high res image (${node.key})`, error);

                                return Observable.empty<[HTMLImageElement, Node]>();
                            });
                })
            .publish()
            .refCount();

        nodeImage$
            .withLatestFrom(tileHandler$)
            .subscribe(
                (args: [[HTMLImageElement, Node], TileHandler]): void => {
                    if (args[0][1].key !== args[1].key ||
                        args[1].provider.disposed) {
                        return;
                    }

                    args[1].provider.updateBackground(args[0][0]);
                });

        nodeImage$
            .map<IImagePlaneGLRendererOperation>(
                (imn: [HTMLImageElement, Node]): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateTextureImage(imn[0], imn[1]);

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);
    }

    protected _deactivate(): void {
        this._rendererDisposer$.next(null);

        this._rendererSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IImagePlaneConfiguration {
        return { imageTiling: false };
    }
}

ComponentService.register(ImagePlaneComponent);
export default ImagePlaneComponent;
