/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import {
    GLRenderStage,
    IGLRenderFunction,
    IGLRender,
    IGLRenderHash,
    RenderCamera,
    RenderService,
    ISize,
} from "../Render";
import {DOM} from "../Utils";

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
    private _renderService: RenderService;
    private _dom: DOM;

    private _renderFrame$: Subject<RenderCamera> = new Subject<RenderCamera>();

    private _renderCameraOperation$: Subject<IRenderCameraOperation> = new Subject<IRenderCameraOperation>();
    private _renderCamera$: Observable<IRenderCamera>;

    private _render$: Subject<IGLRenderHash> = new Subject<IGLRenderHash>();
    private _clear$: Subject<string> = new Subject<string>();
    private _renderOperation$: Subject<IGLRenderHashesOperation> = new Subject<IGLRenderHashesOperation>();
    private _renderCollection$: Observable<IGLRenderHashes>;

    private _rendererOperation$: Subject<IGLRendererOperation> = new Subject<IGLRendererOperation>();
    private _renderer$: Observable<IGLRenderer>;

    private _eraserOperation$: Subject<IEraserOperation> = new Subject<IEraserOperation>();
    private _eraser$: Observable<IEraser>;

    private _webGLRenderer$: Observable<THREE.WebGLRenderer>;

    private _renderFrameSubscription: Subscription;

    constructor (canvasContainer: HTMLElement, renderService: RenderService, dom?: DOM) {
        this._renderService = renderService;
        this._dom = !!dom ? dom : new DOM();

        this._renderer$ = this._rendererOperation$
            .scan(
                (renderer: IGLRenderer, operation: IGLRendererOperation): IGLRenderer => {
                    return operation(renderer);
                },
                { needsRender: false, renderer: null })
            .filter(
                (renderer: IGLRenderer): boolean => {
                    return !!renderer.renderer;
                });

        this._renderCollection$ = this._renderOperation$
            .scan(
                (hashes: IGLRenderHashes, operation: IGLRenderHashesOperation): IGLRenderHashes => {
                    return operation(hashes);
                },
                {})
            .share();

        this._renderCamera$ = this._renderCameraOperation$
            .scan(
                (rc: IRenderCamera, operation: IRenderCameraOperation): IRenderCamera => {
                    return operation(rc);
                },
                { frameId: -1, needsRender: false, perspective: null });

        this._eraser$ = this._eraserOperation$
            .startWith(
                (eraser: IEraser): IEraser => {
                    return eraser;
                })
            .scan(
                (eraser: IEraser, operation: IEraserOperation): IEraser => {
                    return operation(eraser);
                },
                { needsRender: false });

        Observable
            .combineLatest<ICombination>(
                [this._renderer$, this._renderCollection$, this._renderCamera$, this._eraser$],
                (renderer: IGLRenderer, hashes: IGLRenderHashes, rc: IRenderCamera, eraser: IEraser): ICombination => {
                    let renders: IGLRender[] = Object.keys(hashes)
                        .map((key: string): IGLRender => {
                            return hashes[key];
                        });

                    return { camera: rc, eraser: eraser, renderer: renderer, renders: renders };
                })
            .filter(
                (co: ICombination): boolean => {
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
                (n1: number, n2: number): boolean => {
                    return n1 === n2;
                },
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
            .map(
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

        let renderHash$: Observable<IGLRenderHashesOperation> = this._render$
            .map(
                (hash: IGLRenderHash) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        hashes[hash.name] = hash.render;

                        return hashes;
                    };
                });

        let clearHash$: Observable<IGLRenderHashesOperation> = this._clear$
            .map(
                (name: string) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        delete hashes[name];

                        return hashes;
                    };
                });

        Observable
            .merge(renderHash$, clearHash$)
            .subscribe(this._renderOperation$);

        this._webGLRenderer$ = this._render$
            .first()
            .map(
                (hash: IGLRenderHash): THREE.WebGLRenderer => {
                    const canvas: HTMLCanvasElement = this._dom.createElement("canvas", "mapillary-js-canvas");
                    canvas.style.position = "absolute";
                    canvas.setAttribute("tabindex", "0");
                    canvasContainer.appendChild(canvas);

                    const element: HTMLElement = renderService.element;
                    const webGLRenderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ canvas: canvas });
                    webGLRenderer.setPixelRatio(window.devicePixelRatio);
                    webGLRenderer.setSize(element.offsetWidth, element.offsetHeight);
                    webGLRenderer.setClearColor(new THREE.Color(0x202020), 1.0);
                    webGLRenderer.autoClear = false;

                    return webGLRenderer;
                })
            .publishReplay(1)
            .refCount();

        this._webGLRenderer$.subscribe(() => { /*noop*/ });

        let createRenderer$: Observable<IGLRendererOperation> = this._webGLRenderer$
            .first()
            .map(
                (webGLRenderer: THREE.WebGLRenderer): IGLRendererOperation => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        renderer.needsRender = true;
                        renderer.renderer = webGLRenderer;

                        return renderer;
                    };
                });

        let resizeRenderer$: Observable<IGLRendererOperation> = this._renderService.size$
            .map(
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

        let clearRenderer$: Observable<IGLRendererOperation> = this._clear$
            .map(
                (name: string) => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        if (renderer.renderer == null) {
                            return renderer;
                        }

                        renderer.needsRender = true;

                        return renderer;
                    };
                });

        Observable
            .merge(createRenderer$, resizeRenderer$, clearRenderer$)
            .subscribe(this._rendererOperation$);

        let renderCollectionEmpty$: Observable<IGLRenderHashes> = this._renderCollection$
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

                    this._renderFrameSubscription.unsubscribe();
                    this._renderFrameSubscription = null;

                    this._renderFrameSubscribe();
                });

        renderCollectionEmpty$
            .map(
                (hashes: IGLRenderHashes): IEraserOperation => {
                    return (eraser: IEraser): IEraser => {
                        eraser.needsRender = true;

                        return eraser;
                    };
                })
            .subscribe(this._eraserOperation$);
    }

    public get render$(): Subject<IGLRenderHash> {
        return this._render$;
    }

    public get webGLRenderer$(): Observable<THREE.WebGLRenderer> {
        return this._webGLRenderer$;
    }

    public clear(name: string): void {
        this._clear$.next(name);
    }

    private _renderFrameSubscribe(): void {
        this._render$
            .first()
            .map(
                (renderHash: IGLRenderHash): IRenderCameraOperation => {
                    return (irc: IRenderCamera): IRenderCamera => {
                        irc.needsRender = true;

                        return irc;
                    };
                })
             .subscribe(
                (operation: IRenderCameraOperation): void => {
                    this._renderCameraOperation$.next(operation);
                });

        this._renderFrameSubscription = this._render$
            .first()
            .mergeMap(
                (hash: IGLRenderHash): Observable<RenderCamera> => {
                    return this._renderService.renderCameraFrame$;
                })
            .subscribe(this._renderFrame$);
    }
}

export default GLRenderer;
