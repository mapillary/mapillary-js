import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/of";

import "rxjs/add/operator/delay";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/withLatestFrom";

import {ComponentService, Component, IComponentConfiguration, ImagePlaneGLRenderer} from "../../Component";
import {Transform} from "../../Geo";
import {IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
import {ILoadStatusObject, ImageLoader, Node} from "../../Graph";
import {Settings} from "../../Utils";

interface IImagePlaneGLRendererOperation {
    (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer;
}

export class ImagePlaneComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "imageplane";

    private _maxDynamicImageSize: number;

    private _rendererOperation$: Subject<IImagePlaneGLRendererOperation>;
    private _renderer$: Observable<ImagePlaneGLRenderer>;
    private _rendererCreator$: Subject<void>;
    private _rendererDisposer$: Subject<void>;

    private _rendererSubscription: Subscription;
    private _stateSubscription: Subscription;
    private _nodeSubscription: Subscription;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._maxDynamicImageSize = 4096;

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

        this._nodeSubscription = this._navigator.stateService.currentNode$
            .debounceTime(1000)
            .withLatestFrom(this._navigator.stateService.currentTransform$)
            .filter(
                (nt: [Node, Transform]): boolean => {
                    let node: Node = nt[0];
                    let transform: Transform = nt[1];

                    return node.pano ?
                        Math.max(transform.width, transform.height) > Settings.basePanoramaSize :
                        Settings.maxImageSize > Settings.baseImageSize;
                })
            .switchMap<[HTMLImageElement, Node]>(
                (nt: [Node, Transform]): Observable<[HTMLImageElement, Node]> => {
                    let node: Node = nt[0];
                    let transform: Transform = nt[1];

                    let image$: Observable<ILoadStatusObject<HTMLImageElement>> =
                        node.pano ?
                            ImageLoader.loadDynamic(
                                node.key,
                                Math.min(
                                    Math.max(transform.width, transform.height),
                                    this._maxDynamicImageSize)) :
                            ImageLoader.loadThumbnail(node.key, Settings.maxImageSize);

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

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }
}

ComponentService.register(ImagePlaneComponent);
export default ImagePlaneComponent;
