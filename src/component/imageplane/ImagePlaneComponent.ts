/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {ComponentService, Component, ImagePlaneScene, ImagePlaneFactory, TextureLoader} from "../../Component";
import {ICurrentState, IFrame} from "../../State";
import {Container, Navigator} from "../../Viewer";
import {IGLRenderHash, GLRenderStage} from "../../Render";
import {Camera} from "../../Geo";
import {Node} from "../../Graph";
import {Settings} from "../../Utils";

interface IImagePlaneStateOperation {
    (imagePlaneState: ImagePlaneState): ImagePlaneState;
}

class ImagePlaneState {
    private _imagePlaneFactory: ImagePlaneFactory;
    private _imagePlaneScene: ImagePlaneScene;

    private _alpha: number;
    private _alphaOld: number;
    private _fadeOutSpeed: number;
    private _lastCamera: Camera;
    private _epsilon: number;

    private _currentKey: string;
    private _previousKey: string;

    private _frameId: number;
    private _needsRender: boolean;

    constructor() {
        this._imagePlaneFactory = new ImagePlaneFactory();
        this._imagePlaneScene = new ImagePlaneScene();

        this._alpha = 0;
        this._alphaOld = 0;
        this._fadeOutSpeed = 0.05;
        this._lastCamera = new Camera();
        this._epsilon = 0.000001;

        this._currentKey = null;
        this._previousKey = null;

        this._frameId = 0;
        this._needsRender = false;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public updateFrame(frame: IFrame): void {
        this._updateFrameId(frame.id);
        this._needsRender = this._updateAlpha(frame.state.alpha) || this._needsRender;
        this._needsRender = this._updateAlphaOld(frame.state.alpha) || this._needsRender;
        this._needsRender = this._updateImagePlanes(frame.state) || this._needsRender;
    }

    public updateTexture(texture: THREE.Texture, node: Node): void {
        if (this._currentKey !== node.key) {
            return;
        }

        this._needsRender = true;

        for (let plane of this._imagePlaneScene.imagePlanes) {
            let textureOld: THREE.Texture = (<THREE.ShaderMaterial>plane.material).uniforms.projectorTex.value;
            if (textureOld != null) {
                textureOld.dispose();
            }

            (<THREE.ShaderMaterial>plane.material).uniforms.projectorTex.value = texture;
        }
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {
        let planeAlpha: number = this._imagePlaneScene.imagePlanesOld.length ? 1 : this._alpha;

        for (let plane of this._imagePlaneScene.imagePlanes) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = planeAlpha;
        }

        for (let plane of this._imagePlaneScene.imagePlanesOld) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = this._alphaOld;
        }

        renderer.render(this._imagePlaneScene.scene, perspectiveCamera);
        renderer.render(this._imagePlaneScene.sceneOld, perspectiveCamera);

        for (let plane of this._imagePlaneScene.imagePlanes) {
            (<THREE.ShaderMaterial>plane.material).uniforms.opacity.value = this._alpha;
        }

        renderer.render(this._imagePlaneScene.scene, perspectiveCamera);
    }

    public clearNeedsRender(): void {
        this._needsRender = false;
    }

    public dispose(): void {
        this._imagePlaneScene.clear();
    }

    private _updateFrameId(frameId: number): void {
        this._frameId = frameId;
    }

    private _updateAlpha(alpha: number): boolean {
        if (alpha === this._alpha) {
            return false;
        }

        this._alpha = alpha;

        return true;
    }

    private _updateAlphaOld(alpha: number): boolean {
        if (alpha < 1 || this._alphaOld === 0) {
            return false;
        }

        this._alphaOld = Math.max(0, this._alphaOld - this._fadeOutSpeed);

        return true;
    }

    private _updateImagePlanes(state: ICurrentState): boolean {
        if (state.currentNode == null || state.currentNode.key === this._currentKey) {
            return false;
        }

        this._previousKey = state.previousNode != null ? state.previousNode.key : null;
        if (this._previousKey != null) {
            if (this._previousKey !== this._currentKey) {
                let previousMesh: THREE.Mesh =
                    this._imagePlaneFactory.createMesh(state.previousNode, state.previousTransform);

                this._imagePlaneScene.updateImagePlanes([previousMesh]);
            }
        }

        this._currentKey = state.currentNode.key;
        let currentMesh: THREE.Mesh =
            this._imagePlaneFactory.createMesh(state.currentNode, state.currentTransform);

        this._imagePlaneScene.updateImagePlanes([currentMesh]);

        this._alphaOld = 1;

        return true;
    }
}

export class ImagePlaneComponent extends Component {
    public static componentName: string = "imageplane";

    private _imagePlaneStateOperation$: rx.Subject<IImagePlaneStateOperation>;
    private _imagePlaneState$: rx.Observable<ImagePlaneState>;
    private _imagePlaneStateCreator$: rx.Subject<void>;
    private _imagePlaneStateDisposer$: rx.Subject<void>;

    private _imagePlaneStateSubscription: rx.IDisposable;
    private _stateSubscription: rx.IDisposable;
    private _nodeSubscription: rx.IDisposable;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._imagePlaneStateOperation$ = new rx.Subject<IImagePlaneStateOperation>();
        this._imagePlaneStateCreator$ = new rx.Subject<void>();
        this._imagePlaneStateDisposer$ = new rx.Subject<void>();

        this._imagePlaneState$ = this._imagePlaneStateOperation$
            .scan<ImagePlaneState>(
                (imagePlaneState: ImagePlaneState, operation: IImagePlaneStateOperation): ImagePlaneState => {
                    return operation(imagePlaneState);
                },
                null)
            .filter(
                (imagePlaneState: ImagePlaneState): boolean => {
                    return imagePlaneState != null;
                })
            .distinctUntilChanged(
                (imagePlaneState: ImagePlaneState): number => {
                    return imagePlaneState.frameId;
                });

        this._imagePlaneStateCreator$
            .map<IImagePlaneStateOperation>(
                (): IImagePlaneStateOperation => {
                    return (imagePlaneState: ImagePlaneState): ImagePlaneState => {
                        if (imagePlaneState != null) {
                            throw new Error("Multiple image plane states can not be created at the same time");
                        }

                        return new ImagePlaneState();
                    };
                })
            .subscribe(this._imagePlaneStateOperation$);

        this._imagePlaneStateDisposer$
            .map<IImagePlaneStateOperation>(
                (): IImagePlaneStateOperation => {
                    return (imagePlaneState: ImagePlaneState): ImagePlaneState => {
                        imagePlaneState.dispose();

                        return null;
                    };
                })
            .subscribe(this._imagePlaneStateOperation$);
    }

    protected _activate(): void {
        this._imagePlaneStateSubscription = this._imagePlaneState$
            .map<IGLRenderHash>(
                (imagePlaneState: ImagePlaneState): IGLRenderHash => {
                    let renderHash: IGLRenderHash = {
                        name: this._name,
                        render: {
                            frameId: imagePlaneState.frameId,
                            needsRender: imagePlaneState.needsRender,
                            render: imagePlaneState.render.bind(imagePlaneState),
                            stage: GLRenderStage.Background,
                        },
                    };

                    imagePlaneState.clearNeedsRender();

                    return renderHash;
                })
            .subscribe(this._container.glRenderer.render$);

        this._imagePlaneStateCreator$.onNext(null);

        this._stateSubscription = this._navigator.stateService.currentState$
            .map<IImagePlaneStateOperation>(
                (frame: IFrame): IImagePlaneStateOperation => {
                    return (imagePlaneState: ImagePlaneState): ImagePlaneState => {
                        imagePlaneState.updateFrame(frame);

                        return imagePlaneState;
                    };
                })
            .subscribe(this._imagePlaneStateOperation$);

        this._nodeSubscription = this._navigator.stateService.currentNode$
            .filter(
                (node: Node): boolean => {
                    return Settings.maxImageSize > Settings.baseImageSize;
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
            .map<IImagePlaneStateOperation>(
                (tn: [THREE.Texture, Node]): IImagePlaneStateOperation => {
                    return (imagePlaneState: ImagePlaneState): ImagePlaneState => {
                        imagePlaneState.updateTexture(tn[0], tn[1]);

                        return imagePlaneState;
                    };
                })
            .subscribe(this._imagePlaneStateOperation$);
    }

    protected _deactivate(): void {
        this._imagePlaneStateDisposer$.onNext(null);

        this._imagePlaneStateSubscription.dispose();
        this._stateSubscription.dispose();
        this._nodeSubscription.dispose();
    }
}

ComponentService.register(ImagePlaneComponent);
export default ImagePlaneComponent;
