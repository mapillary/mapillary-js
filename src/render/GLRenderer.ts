/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/first";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/share";
import "rxjs/add/operator/startWith";

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
    private _renderService: RenderService;

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

    constructor (renderService: RenderService) {
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
                { frameId: -1, needsRender: false, perspective: null });

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

                    let ts: number = window.performance.now();

                    renderer.clear();

                    for (let render of backgroundRenders) {
                        render(perspectiveCamera, renderer);
                    }

                    renderer.clearDepth();

                    for (let render of foregroundRenders) {
                        render(perspectiveCamera, renderer);
                    }

                    let te: number = window.performance.now();
                    if (te - ts > 10) {
                        console.warn("Render to screen", (te - ts).toFixed(2));
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

        let renderHash$: Observable<IGLRenderHashesOperation> = this._render$
            .map<IGLRenderHashesOperation>(
                (hash: IGLRenderHash) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        hashes[hash.name] = hash.render;

                        return hashes;
                    };
                });

        let clearHash$: Observable<IGLRenderHashesOperation> = this._clear$
            .map<IGLRenderHashesOperation>(
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
            .map<THREE.WebGLRenderer>(
                (hash: IGLRenderHash): THREE.WebGLRenderer => {
                    let element: HTMLElement = renderService.element;

                    let webGLRenderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
                    webGLRenderer.setPixelRatio(window.devicePixelRatio);
                    webGLRenderer.setSize(element.offsetWidth, element.offsetHeight);
                    webGLRenderer.setClearColor(new THREE.Color(0x202020), 1.0);
                    webGLRenderer.autoClear = false;
                    webGLRenderer.sortObjects = false;

                    element.appendChild(webGLRenderer.domElement);

                    return webGLRenderer;
                })
            .publishReplay(1)
            .refCount();

        this._webGLRenderer$.subscribe();

        let createRenderer$: Observable<IGLRendererOperation> = this._webGLRenderer$
            .first()
            .map<IGLRendererOperation>(
                (webGLRenderer: THREE.WebGLRenderer): IGLRendererOperation => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        renderer.needsRender = true;
                        renderer.renderer = webGLRenderer;

                        return renderer;
                    };
                });

        let resizeRenderer$: Observable<IGLRendererOperation> = this._renderService.size$
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

        let clearRenderer$: Observable<IGLRendererOperation> = this._clear$
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
            .map<IEraserOperation>(
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
            .map<IRenderCameraOperation>(
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
            .mergeMap<RenderCamera>(
                (hash: IGLRenderHash): Observable<RenderCamera> => {
                    return this._renderService.renderCameraFrame$;
                })
            .subscribe(this._renderFrame$);
    }
}

export default GLRenderer;
