/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {ComponentService, Component, ImagePlaneGLRenderer, TextureLoader} from "../../Component";
import {IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
import {Node} from "../../Graph";
import {Settings} from "../../Utils";

interface IImagePlaneGLRendererOperation {
    (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer;
}

export class ImagePlaneComponent extends Component {
    public static componentName: string = "imageplane";

    private _rendererOperation$: rx.Subject<IImagePlaneGLRendererOperation>;
    private _renderer$: rx.Observable<ImagePlaneGLRenderer>;
    private _rendererCreator$: rx.Subject<void>;
    private _rendererDisposer$: rx.Subject<void>;

    private _rendererSubscription: rx.IDisposable;
    private _stateSubscription: rx.IDisposable;
    private _nodeSubscription: rx.IDisposable;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._rendererOperation$ = new rx.Subject<IImagePlaneGLRendererOperation>();
        this._rendererCreator$ = new rx.Subject<void>();
        this._rendererDisposer$ = new rx.Subject<void>();

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

        this._rendererCreator$.onNext(null);

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
            .filter(
                (node: Node): boolean => {
                    return node.pano ?
                        Settings.maxImageSize > Settings.basePanoramaSize :
                        Settings.maxImageSize > Settings.baseImageSize;
                })
            .flatMapLatest(
                (node: Node): rx.Observable<[THREE.Texture, Node]> => {
                    return rx.Observable
                        .just<void>(null)
                        .delay(2000)
                        .flatMap<THREE.Texture>(
                            (): rx.Observable<THREE.Texture> => {
                                let textureLoader: TextureLoader = new TextureLoader();

                                return textureLoader.load(node.key, Settings.maxImageSize);
                            })
                        .zip(
                            rx.Observable.just<Node>(node),
                            (t: THREE.Texture, n: Node): [THREE.Texture, Node] => {
                                return [t, n];
                            });
                })
            .map<IImagePlaneGLRendererOperation>(
                (tn: [THREE.Texture, Node]): IImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateTexture(tn[0], tn[1]);

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);
    }

    protected _deactivate(): void {
        this._rendererDisposer$.onNext(null);

        this._rendererSubscription.dispose();
        this._stateSubscription.dispose();
        this._nodeSubscription.dispose();
    }
}

ComponentService.register(ImagePlaneComponent);
export default ImagePlaneComponent;
