import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/catch";
import "rxjs/add/operator/combineLatest";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/pairwise";
import "rxjs/add/operator/publish";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/skipWhile";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/takeUntil";
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
    RenderCamera,
} from "../../Render";
import {Node} from "../../Graph";
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

type PositionLookat = [THREE.Vector3, THREE.Vector3, number];

export class ImagePlaneComponent extends Component<IImagePlaneConfiguration> {
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

        this._renderer$ = this._rendererOperation$
            .scan(
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
            .map(
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
            .map(
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
            .map(
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
            .map(
                (frame: IFrame): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateFrame(frame);

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);

        let textureProvider$: Observable<TextureProvider> = this._navigator.stateService.currentState$
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
                (args: [IFrame, THREE.WebGLRenderer, ISize]): TextureProvider => {
                    let state: ICurrentState = args[0].state;
                    let renderer: THREE.WebGLRenderer = args[1];
                    let viewportSize: ISize = args[2];

                    let currentNode: Node = state.currentNode;
                    let currentTransform: Transform = state.currentTransform;
                    let tileSize: number = Math.max(viewportSize.width, viewportSize.height) > 1024 ? 1024 : 512;

                    return new TextureProvider(
                        currentNode.key,
                        currentTransform.basicWidth,
                        currentTransform.basicHeight,
                        tileSize,
                        currentNode.image,
                        this._imageTileLoader,
                        new ImageTileStore(),
                        renderer);
                })
            .publishReplay(1)
            .refCount();

        this._textureProviderSubscription = textureProvider$.subscribe();

        this._setTextureProviderSubscription = textureProvider$
            .map(
                (provider: TextureProvider): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.setTextureProvider(provider.key, provider);

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);

        this._abortTextureProviderSubscription = textureProvider$
            .pairwise()
            .subscribe(
                (pair: [TextureProvider, TextureProvider]): void => {
                    let previous: TextureProvider = pair[0];
                    previous.abort();
                });

        let roiTrigger$: Observable<[RenderCamera, ISize, Transform]> = this._container.renderService.renderCameraFrame$
            .map(
                (renderCamera: RenderCamera): PositionLookat => {
                    return [
                        renderCamera.camera.position.clone(),
                        renderCamera.camera.lookat.clone(),
                        renderCamera.zoom.valueOf()];
                })
            .pairwise()
            .skipWhile(
                (pls: [PositionLookat, PositionLookat]): boolean => {
                    return pls[1][2] - pls[0][2] < 0 || pls[1][2] === 0;
                })
            .map(
                (pls: [PositionLookat, PositionLookat]): boolean => {
                    let samePosition: boolean = pls[0][0].equals(pls[1][0]);
                    let sameLookat: boolean = pls[0][1].equals(pls[1][1]);
                    let sameZoom: boolean = pls[0][2] === pls[1][2];

                    return samePosition && sameLookat && sameZoom;
                })
            .distinctUntilChanged()
            .filter(
                (stalled: boolean): boolean => {
                    return stalled;
                })
            .switchMap(
                (stalled: boolean): Observable<RenderCamera> => {
                    return this._container.renderService.renderCameraFrame$
                        .first();
                })
            .withLatestFrom(
                this._container.renderService.size$,
                this._navigator.stateService.currentTransform$);

        this._setRegionOfInterestSubscription = textureProvider$
            .switchMap(
                (provider: TextureProvider): Observable<[IRegionOfInterest, TextureProvider]> => {
                    return roiTrigger$
                        .map(
                            (args: [RenderCamera, ISize, Transform]): [IRegionOfInterest, TextureProvider] => {
                                return [
                                    this._roiCalculator.computeRegionOfInterest(args[0], args[1], args[2]),
                                    provider,
                                ];
                            });
                })
            .filter(
                (args: [IRegionOfInterest, TextureProvider]): boolean => {
                    return !args[1].disposed;
                })
            .subscribe(
                (args: [IRegionOfInterest, TextureProvider]): void => {
                    let roi: IRegionOfInterest = args[0];
                    let provider: TextureProvider = args[1];

                    provider.setRegionOfInterest(roi);
                });

        let hasTexture$: Observable<boolean> = textureProvider$
            .switchMap(
                (provider: TextureProvider): Observable<boolean> => {
                    return provider.hasTexture$;
                })
            .startWith(false)
            .publishReplay(1)
            .refCount();

        this._hasTextureSubscription = hasTexture$.subscribe();

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
            .switchMap(
                (node: Node): Observable<[HTMLImageElement, Node]> => {
                    let baseImageSize: ImageSize = node.pano ?
                        Settings.basePanoramaSize :
                        Settings.baseImageSize;

                    if (Math.max(node.image.width, node.image.height) > baseImageSize) {
                        return Observable.empty<[HTMLImageElement, Node]>();
                    }

                    let image$: Observable<[HTMLImageElement, Node]> = node
                        .cacheImage$(Settings.maxImageSize)
                            .map(
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

        this._updateBackgroundSubscription = nodeImage$
            .withLatestFrom(textureProvider$)
            .subscribe(
                (args: [[HTMLImageElement, Node], TextureProvider]): void => {
                    if (args[0][1].key !== args[1].key ||
                        args[1].disposed) {
                        return;
                    }

                    args[1].updateBackground(args[0][0]);
                });

        this._updateTextureImageSubscription = nodeImage$
            .map(
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

        this._abortTextureProviderSubscription.unsubscribe();
        this._hasTextureSubscription.unsubscribe();
        this._rendererSubscription.unsubscribe();
        this._setRegionOfInterestSubscription.unsubscribe();
        this._setTextureProviderSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
        this._textureProviderSubscription.unsubscribe();
        this._updateBackgroundSubscription.unsubscribe();
        this._updateTextureImageSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IImagePlaneConfiguration {
        return { imageTiling: false };
    }
}

ComponentService.register(ImagePlaneComponent);
export default ImagePlaneComponent;
