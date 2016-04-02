/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";
import * as _ from "underscore";

import {
    GLRenderStage,
    IGLRenderFunction,
    IGLRender,
    IGLRenderHash,
    RenderCamera,
    RenderService,
    ISize,
} from "../Render";

interface IGLRenderer {
    needsRender: boolean;
    renderer: THREE.WebGLRenderer;
}

interface IRenderCamera {
    frameId: number;
    needsRender: boolean;
    perspective: THREE.PerspectiveCamera;
}

interface IGLRenderHashes {
    [name: string]: IGLRender;
}

interface IEraser {
    needsRender: boolean;
}

interface IGLRendererOperation {
    (renderer: IGLRenderer): IGLRenderer;
}

interface IRenderCameraOperation {
    (camera: IRenderCamera): IRenderCamera;
}

interface IGLRenderHashesOperation extends Function {
    (hashes: IGLRenderHashes): IGLRenderHashes;
}

interface IEraserOperation {
    (eraser: IEraser): IEraser;
}

interface ICombination {
    camera: IRenderCamera;
    eraser: IEraser;
    renderer: IGLRenderer;
    renders: IGLRender[];
}

export class GLRenderer {
    private _element: HTMLElement;
    private _renderService: RenderService;

    private _renderFrame$: rx.Subject<RenderCamera> = new rx.Subject<RenderCamera>();

    private _renderCameraOperation$: rx.Subject<IRenderCameraOperation> = new rx.Subject<IRenderCameraOperation>();
    private _renderCamera$: rx.Observable<IRenderCamera>;

    private _render$: rx.Subject<IGLRenderHash> = new rx.Subject<IGLRenderHash>();
    private _clear$: rx.Subject<string> = new rx.Subject<string>();
    private _renderOperation$: rx.Subject<IGLRenderHashesOperation> = new rx.Subject<IGLRenderHashesOperation>();
    private _renderCollection$: rx.Observable<IGLRenderHashes>;

    private _rendererOperation$: rx.Subject<IGLRendererOperation> = new rx.Subject<IGLRendererOperation>();
    private _renderer$: rx.Observable<IGLRenderer>;

    private _eraserOperation$: rx.Subject<IEraserOperation> = new rx.Subject<IEraserOperation>();
    private _eraser$: rx.Observable<IEraser>;

    private _renderFrameSubscription: rx.IDisposable;

    constructor (element: HTMLElement, renderService: RenderService) {
        this._element = element;
        this._renderService = renderService;

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
                {})
            .share();

        this._renderCamera$ = this._renderCameraOperation$
            .scan<IRenderCamera>(
                (rc: IRenderCamera, operation: IRenderCameraOperation): IRenderCamera => {
                    return operation(rc);
                },
                { frameId: -1, needsRender: false, perspective: null })
            .filter(
                (rc: IRenderCamera): boolean => {
                    return rc.perspective != null;
                });

        this._eraser$ = this._eraserOperation$
            .startWith(
                (eraser: IEraser): IEraser => {
                    return eraser;
                })
            .scan<IEraser>(
                (eraser: IEraser, operation: IEraserOperation): IEraser => {
                    return operation(eraser);
                },
                { needsRender: false });

        rx.Observable
            .combineLatest(
                this._renderer$,
                this._renderCollection$,
                this._renderCamera$,
                this._eraser$,
                (renderer: IGLRenderer, hashes: IGLRenderHashes, rc: IRenderCamera, eraser: IEraser): ICombination => {
                    return { camera: rc, eraser: eraser, renderer: renderer, renders: _.values(hashes) };
                })
            .filter(
                (co: ICombination) => {
                    let needsRender: boolean =
                        co.renderer.needsRender ||
                        co.camera.needsRender ||
                        co.eraser.needsRender;

                    let frameId: number = co.camera.frameId;

                    for (let render of co.renders) {
                        if (render.frameId !== frameId) {
                            return false;
                        }

                        needsRender = needsRender || render.needsRender;
                    }

                    return needsRender;
                })
            .distinctUntilChanged(
                (co: ICombination): number => {
                    return co.eraser.needsRender ? -1 : co.camera.frameId;
                })
            .subscribe(
                (co: ICombination): void => {
                    co.renderer.needsRender = false;
                    co.camera.needsRender = false;
                    co.eraser.needsRender = false;

                    let perspectiveCamera: THREE.PerspectiveCamera = co.camera.perspective;

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

        this._renderFrame$
            .map<IRenderCameraOperation>(
                (rc: RenderCamera): IRenderCameraOperation => {
                    return (irc: IRenderCamera): IRenderCamera => {
                        irc.frameId = rc.frameId;
                        irc.perspective = rc.perspective;

                        if (rc.changed === true) {
                            irc.needsRender = true;
                        }

                        return irc;
                    };
                })
            .subscribe(this._renderCameraOperation$);

        this._renderFrameSubscribe();

        let createRenderer$: rx.Observable<IGLRendererOperation> = this._render$
            .first()
            .map<IGLRendererOperation>(
                (hash: IGLRenderHash): IGLRendererOperation => {
                    return (renderer: IGLRenderer): IGLRenderer => {
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
                    };
                });

        let resizeRenderer$: rx.Observable<IGLRendererOperation> = this._renderService.size$
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
                });

        let clearRenderer$: rx.Observable<IGLRendererOperation> = this._clear$
            .map<IGLRendererOperation>(
                (name: string) => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        if (renderer.renderer == null) {
                            return renderer;
                        }

                        renderer.needsRender = true;

                        return renderer;
                    };
                });

        rx.Observable
            .merge(createRenderer$, resizeRenderer$, clearRenderer$)
            .subscribe(this._rendererOperation$);

        let renderHash$: rx.Observable<IGLRenderHashesOperation> = this._render$
            .map<IGLRenderHashesOperation>(
                (hash: IGLRenderHash) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        hashes[hash.name] = hash.render;

                        return hashes;
                    };
                });

        let clearHash$: rx.Observable<IGLRenderHashesOperation> = this._clear$
            .map<IGLRenderHashesOperation>(
                (name: string) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        delete hashes[name];

                        return hashes;
                    };
                });

        rx.Observable
            .merge(renderHash$, clearHash$)
            .subscribe(this._renderOperation$);

        let renderCollectionEmpty$: rx.Observable<IGLRenderHashes> = this._renderCollection$
            .filter(
                (hashes: IGLRenderHashes): boolean => {
                    return Object.keys(hashes).length === 0;
                })
            .share();

        renderCollectionEmpty$
            .subscribe(
                (hashes: IGLRenderHashes): void => {
                    if (this._renderFrameSubscription == null) {
                        return;
                    }

                    this._renderFrameSubscription.dispose();
                    this._renderFrameSubscription = null;

                    this._renderFrameSubscribe();
                });

        renderCollectionEmpty$
            .map<IEraserOperation>(
                (hashes: IGLRenderHashes): IEraserOperation => {
                    return (eraser: IEraser): IEraser => {
                        eraser.needsRender = true;

                        return eraser;
                    };
                })
            .subscribe(this._eraserOperation$);
    }

    public get render$(): rx.Subject<IGLRenderHash> {
        return this._render$;
    }

    public clear(name: string): void {
        this._clear$.onNext(name);
    }

    private _renderFrameSubscribe(): void {
        this._renderFrameSubscription = this._render$
            .first()
            .flatMap<RenderCamera>(
                (hash: IGLRenderHash): rx.Observable<RenderCamera> => {
                    return this._renderService.renderCameraFrame$;
                })
            .subscribe(this._renderFrame$);
    }
}

export default GLRenderer;
