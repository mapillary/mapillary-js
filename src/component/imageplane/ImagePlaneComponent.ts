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

import {ComponentService, Component, IImagePlaneConfiguration, ImagePlaneGLRenderer} from "../../Component";
import {Transform} from "../../Geo";
import {IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
import {ILoadStatusObject, ImageLoader, Node} from "../../Graph";
import {Settings} from "../../Utils";

interface IImagePlaneGLRendererOperation {
    (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer;
}

export class ImagePlaneComponent extends Component<IImagePlaneConfiguration> {
    public static componentName: string = "imagePlane";

    private _rendererOperation$: Subject<IImagePlaneGLRendererOperation>;
    private _renderer$: Observable<ImagePlaneGLRenderer>;
    private _rendererCreator$: Subject<void>;
    private _rendererDisposer$: Subject<void>;

    private _rendererSubscription: Subscription;
    private _stateSubscription: Subscription;
    private _nodeSubscription: Subscription;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

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

        this._nodeSubscription = Observable
            .combineLatest(
                this._navigator.stateService.currentNode$,
                this._configuration$)
            .debounceTime(1000)
            .withLatestFrom(
                this._navigator.stateService.currentTransform$,
                (nc: [Node, IImagePlaneConfiguration], t: Transform): [Node, IImagePlaneConfiguration, Transform] => {
                    return [nc[0], nc[1], t];
                })
            .map<[Node, number]>(
                (params: [Node, IImagePlaneConfiguration, Transform]): [Node, number] => {
                    let node: Node = params[0];
                    let configuration: IImagePlaneConfiguration = params[1];
                    let transform: Transform = params[2];

                    let imageSize: number = Settings.maxImageSize;

                    if (node.pano) {
                        if (configuration.maxPanoramaResolution === "high") {
                            imageSize = Math.max(imageSize, Math.min(4096, Math.max(transform.width, transform.height)));
                        } else if (configuration.maxPanoramaResolution === "full") {
                            imageSize = Math.max(imageSize, transform.width, transform.height);
                        }
                    }

                    return [node, imageSize];
                })
            .filter(
                (params: [Node, number]): boolean => {
                    let node: Node = params[0];
                    let imageSize: number = params[1];

                    return node.pano ?
                        imageSize > Settings.basePanoramaSize :
                        imageSize > Settings.baseImageSize;
                })
            .switchMap<[HTMLImageElement, Node]>(
                (params: [Node, number]): Observable<[HTMLImageElement, Node]> => {
                    let node: Node = params[0];
                    let imageSize: number = params[1];

                    let image$: Observable<ILoadStatusObject<HTMLImageElement>> =
                        node.pano && imageSize > Settings.maxImageSize ?
                            ImageLoader.loadDynamic(node.key, imageSize) :
                            ImageLoader.loadThumbnail(node.key, imageSize);

                    return image$
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
                            (i: HTMLImageElement, n: Node): [HTMLImageElement, Node] => {
                                return [i, n];
                            })
                        .catch(
                            (error: Error, caught: Observable<[HTMLImageElement, Node]>):
                                Observable<[HTMLImageElement, Node]> => {
                                console.error(`Failed to fetch high res image (${node.key})`, error);

                                return Observable.empty<[HTMLImageElement, Node]>();
                            });
                })
            .map<IImagePlaneGLRendererOperation>(
                (imn: [HTMLImageElement, Node]): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateTexture(imn[0], imn[1]);

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);
    }

    protected _deactivate(): void {
        this._rendererDisposer$.next(null);

        this._rendererSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
        this._nodeSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IImagePlaneConfiguration {
        return { maxPanoramaResolution: "auto" };
    }
}

ComponentService.register(ImagePlaneComponent);
export default ImagePlaneComponent;
