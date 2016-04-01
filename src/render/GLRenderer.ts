/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";
import * as _ from "underscore";

import {IFrame} from "../State";
import {Camera, Transform} from "../Geo";
import {
    RenderMode,
    GLRenderStage,
    IGLRenderFunction,
    IGLRender,
    IGLRenderHash,
    RenderService,
    ISize,
} from "../Render";

class CameraState {
    public alpha: number;
    public currentAspect: number;
    public currentOrientation: number;
    public currentPano: boolean;
    public focal: number;
    public frameId: number;
    public needsRender: boolean;
    public previousAspect: number;
    public previousOrientation: number;
    public previousPano: boolean;
    public renderMode: RenderMode;

    private _lastCamera: Camera;
    private _perspective: THREE.PerspectiveCamera;

    constructor(perspectiveCameraAspect: number) {
        this.alpha = 0;
        this.currentAspect = 1;
        this.currentOrientation = 1;
        this.currentPano = false;
        this.focal = 1;
        this.frameId = 0;
        this.needsRender = false;
        this.previousAspect = 1;
        this.previousOrientation = 1;
        this.previousPano = false;
        this.renderMode = RenderMode.Letterbox;

        this._lastCamera = new Camera();
        this._perspective = new THREE.PerspectiveCamera(
            50,
            perspectiveCameraAspect,
            0.4,
            10000);
    }

    public get perspective(): THREE.PerspectiveCamera {
        return this._perspective;
    }

    public get lastCamera(): Camera {
        return this._lastCamera;
    }

    public updateProjection(): void {
        let currentAspect: number = this._getAspect(
            this.currentAspect,
            this.currentOrientation,
            this.currentPano,
            this.perspective.aspect);

        let previousAspect: number = this._getAspect(
            this.previousAspect,
            this.previousOrientation,
            this.previousPano,
            this.perspective.aspect);

        let aspect: number = (1 - this.alpha) * previousAspect + this.alpha * currentAspect;

        let verticalFov: number = 2 * Math.atan(0.5 / aspect / this.focal) * 180 / Math.PI;

        this._perspective.fov = verticalFov;
        this._perspective.updateProjectionMatrix();
    }

    public updatePerspective(camera: Camera): void {
        this._perspective.up.copy(camera.up);
        this._perspective.position.copy(camera.position);
        this._perspective.lookAt(camera.lookat);
    }

    private _getAspect(
        nodeAspect: number,
        orientation: number,
        pano: boolean,
        perspectiveCameraAspect: number): number {

        if (pano) {
            return 4 / 3 > perspectiveCameraAspect ? perspectiveCameraAspect : 4 / 3;
        }

        let coeff: number = orientation < 5 ?
            1 :
            1 / nodeAspect / nodeAspect;

        let usePerspective: boolean = this.renderMode === RenderMode.Letterbox ?
            nodeAspect > perspectiveCameraAspect :
            nodeAspect < perspectiveCameraAspect;

        let aspect: number = usePerspective ?
            coeff * perspectiveCameraAspect :
            coeff * nodeAspect;

        return aspect;
    }
}

interface IGLRenderer {
    needsRender: boolean;
    renderer: THREE.WebGLRenderer;
}

interface IGLRenderHashes {
    [name: string]: IGLRender;
}

interface IGLRendererOperation {
    (renderer: IGLRenderer): IGLRenderer;
}

interface ICameraStateOperation {
    (camera: CameraState): CameraState;
}

interface IGLRenderHashesOperation extends Function {
    (hashes: IGLRenderHashes): IGLRenderHashes;
}

interface ICombination {
    cameraState: CameraState;
    renderer: IGLRenderer;
    renders: IGLRender[];
}

export class GLRenderer {
    private _element: HTMLElement;
    private _renderService: RenderService;
    private _currentFrame$: rx.Observable<IFrame>;

    private _frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();
    private _cameraStateOperation$: rx.Subject<ICameraStateOperation> = new rx.Subject<ICameraStateOperation>();
    private _cameraState$: rx.Observable<CameraState>;

    private _render$: rx.Subject<IGLRenderHash> = new rx.Subject<IGLRenderHash>();
    private _clear$: rx.Subject<string> = new rx.Subject<string>();
    private _renderOperation$: rx.Subject<IGLRenderHashesOperation> = new rx.Subject<IGLRenderHashesOperation>();
    private _renderCollection$: rx.Observable<IGLRenderHashes>;

    private _rendererOperation$: rx.Subject<IGLRendererOperation> = new rx.Subject<IGLRendererOperation>();
    private _renderer$: rx.Observable<IGLRenderer>;

    private _frameSubscription: rx.IDisposable;

    constructor (element: HTMLElement, renderService: RenderService, currentFrame$: rx.Observable<IFrame>) {
        this._element = element;
        this._renderService = renderService;
        this._currentFrame$ = currentFrame$;

        this._renderer$ = this._rendererOperation$
            .scan<IGLRenderer>(
                (renderer: IGLRenderer, operation: IGLRendererOperation): IGLRenderer => {
                    return operation(renderer);
                },
                { needsRender: false, renderer: null });

        this._renderCollection$ = this._renderOperation$
            .scan<IGLRenderHashes>(
                (hashes: IGLRenderHashes, operation: IGLRenderHashesOperation): IGLRenderHashes => {
                    return operation(hashes);
                },
                {});

        this._cameraState$ = this._cameraStateOperation$
            .scan<CameraState>(
                (cs: CameraState, operation: ICameraStateOperation): CameraState => {
                    return operation(cs);
                },
                new CameraState(this._element.offsetWidth / this._element.offsetHeight));

        rx.Observable
            .combineLatest(
                this._cameraState$,
                this._renderCollection$,
                this._renderer$,
                (cs: CameraState, hashes: IGLRenderHashes, renderer: IGLRenderer): ICombination => {
                    return { cameraState: cs, renderer: renderer, renders: _.values(hashes) };
                })
            .filter(
                (co: ICombination) => {
                    let needsRender: boolean =
                        co.cameraState.needsRender ||
                        co.renderer.needsRender;

                    let frameId: number = co.cameraState.frameId;

                    for (let render of co.renders) {
                        if (render.frameId !== frameId) {
                            return false;
                        }

                        needsRender = needsRender || render.needsRender;
                    }

                    return needsRender;
                })
            .distinctUntilChanged((co: ICombination): number => { return co.cameraState.frameId; })
            .subscribe(
                (co: ICombination): void => {
                    co.cameraState.needsRender = false;
                    co.renderer.needsRender = false;

                    let perspectiveCamera: THREE.PerspectiveCamera = co.cameraState.perspective;

                    let backgroundRenders: IGLRenderFunction[] = [];
                    let foregroundRenders: IGLRenderFunction[] = [];

                    for (let render of co.renders) {
                        if (render.stage === GLRenderStage.Background) {
                            backgroundRenders.push(render.render);
                        } else if (render.stage === GLRenderStage.Foreground) {
                            foregroundRenders.push(render.render);
                        }
                    }

                    let renderer: THREE.WebGLRenderer = co.renderer.renderer;

                    renderer.autoClear = false;
                    renderer.clear();

                    for (let render of backgroundRenders) {
                        render(perspectiveCamera, renderer);
                    }

                    renderer.clearDepth();

                    for (let render of foregroundRenders) {
                        render(perspectiveCamera, renderer);
                    }
                });

        this._render$
            .first()
            .subscribe(
                (hash: IGLRenderHash): void => {
                    this._rendererOperation$.onNext((renderer: IGLRenderer): IGLRenderer => {
                        let webGLRenderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();

                        webGLRenderer.setSize(this._element.offsetWidth, this._element.offsetHeight);
                        webGLRenderer.setClearColor(new THREE.Color(0x202020), 1.0);
                        webGLRenderer.sortObjects = false;

                        webGLRenderer.domElement.style.width = "100%";
                        webGLRenderer.domElement.style.height = "100%";

                        this._element.appendChild(webGLRenderer.domElement);

                        renderer.needsRender = true;
                        renderer.renderer = webGLRenderer;

                        return renderer;
                    });
                });

        this._frameSubscribe();

        this._render$
            .map<IGLRenderHashesOperation>(
                (hash: IGLRenderHash) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        hashes[hash.name] = hash.render;

                        return hashes;
                    };
                })
            .subscribe(this._renderOperation$);

        this._clear$
            .map<IGLRenderHashesOperation>(
                (name: string) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        delete hashes[name];

                        return hashes;
                    };
                })
            .subscribe(this._renderOperation$);

        this._clear$
            .map<IGLRendererOperation>(
                (name: string) => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        if (renderer.renderer == null) {
                            return renderer;
                        }

                        renderer.needsRender = true;

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);

        this._renderCollection$
            .subscribe(
                (hashes: IGLRenderHashes): void => {
                    if (Object.keys(hashes).length || this._frameSubscription == null) {
                        return;
                    }

                    this._frameSubscription.dispose();
                    this._frameSubscription = null;

                    this._frameSubscribe();
                });

        this._frame$
            .map<ICameraStateOperation>(
                (frame: IFrame): ICameraStateOperation => {
                    return (cs: CameraState): CameraState => {
                        cs.frameId = frame.id;

                        let current: Camera = frame.state.camera;

                        if (cs.lastCamera.diff(current) < 0.00001 && cs.alpha === frame.state.alpha) {
                            return cs;
                        }

                        cs.alpha = frame.state.alpha;
                        cs.focal = current.focal;

                        let currentTransform: Transform = frame.state.currentTransform;
                        let previousTransform: Transform = frame.state.previousTransform;

                        if (previousTransform == null) {
                            previousTransform = frame.state.currentTransform;
                        }

                        cs.currentAspect = currentTransform.aspect;
                        cs.currentOrientation = currentTransform.orientation;
                        cs.currentPano = frame.state.currentNode.fullPano;
                        cs.previousAspect = previousTransform.aspect;
                        cs.previousOrientation = previousTransform.orientation;
                        cs.previousPano = frame.state.previousNode != null && frame.state.previousNode.fullPano;

                        cs.updateProjection();
                        cs.updatePerspective(current);

                        cs.lastCamera.copy(current);
                        cs.needsRender = true;

                        return cs;
                    };
                })
            .subscribe(this._cameraStateOperation$);

        this._renderService.size$
            .map<ICameraStateOperation>(
                (size: ISize) => {
                    return (cs: CameraState): CameraState => {
                        cs.perspective.aspect = size.width / size.height;

                        cs.updateProjection();
                        cs.needsRender = true;

                        return cs;
                    };
                })
            .subscribe(this._cameraStateOperation$);

        this._renderService.size$
            .map<IGLRendererOperation>(
                (size: ISize): IGLRendererOperation => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        if (renderer.renderer == null) {
                            return renderer;
                        }

                        renderer.renderer.setSize(size.width, size.height);
                        renderer.needsRender = true;

                        return renderer;
                    };
                })
            .subscribe(this._rendererOperation$);

        this._renderService.renderMode$
            .map<ICameraStateOperation>(
                (renderMode: RenderMode) => {
                    return (cs: CameraState): CameraState => {
                        cs.renderMode = renderMode;

                        cs.updateProjection();
                        cs.needsRender = true;

                        return cs;
                    };
                })
            .subscribe(this._cameraStateOperation$);
    }

    public get render$(): rx.Subject<IGLRenderHash> {
        return this._render$;
    }

    public clear(name: string): void {
        this._clear$.onNext(name);
    }

    private _frameSubscribe(): void {
        this._render$
            .first()
            .subscribe((hash: IGLRenderHash): void => {
                this._frameSubscription = this._currentFrame$.subscribe(this._frame$);
            });
    }
}

export default GLRenderer;
