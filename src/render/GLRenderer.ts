import {
    combineLatest as observableCombineLatest,
    merge as observableMerge,
    of as observableOf,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    distinctUntilChanged,
    filter,
    first,
    map,
    mergeMap,
    publishReplay,
    refCount,
    scan,
    share,
    startWith,
} from "rxjs/operators";

import * as THREE from "three";

import {
    GLRenderStage,
    IGLRenderFunction,
    IGLRender,
    IGLRenderHash,
    RenderCamera,
    RenderService,
    ISize,
} from "../Render";
import { DOM } from "../Utils";
import SubscriptionHolder from "../utils/SubscriptionHolder";

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

    private _renderFrame$: Subject<RenderCamera> =
        new Subject<RenderCamera>();

    private _renderCameraOperation$: Subject<IRenderCameraOperation> =
        new Subject<IRenderCameraOperation>();
    private _renderCamera$: Observable<IRenderCamera>;

    private _render$: Subject<IGLRenderHash> = new Subject<IGLRenderHash>();
    private _clear$: Subject<string> = new Subject<string>();
    private _renderOperation$: Subject<IGLRenderHashesOperation> =
        new Subject<IGLRenderHashesOperation>();
    private _renderCollection$: Observable<IGLRenderHashes>;

    private _rendererOperation$: Subject<IGLRendererOperation> =
        new Subject<IGLRendererOperation>();
    private _renderer$: Observable<IGLRenderer>;

    private _eraserOperation$: Subject<IEraserOperation> = new Subject<IEraserOperation>();
    private _eraser$: Observable<IEraser>;

    private _webGLRenderer$: Observable<THREE.WebGLRenderer>;

    private _renderFrameSubscription: Subscription;
    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    constructor(
        canvasContainer: HTMLElement,
        renderService: RenderService,
        dom?: DOM) {
        this._renderService = renderService;
        this._dom = !!dom ? dom : new DOM();
        const subs = this._subscriptions;

        this._renderer$ = this._rendererOperation$.pipe(
            scan(
                (renderer: IGLRenderer, operation: IGLRendererOperation): IGLRenderer => {
                    return operation(renderer);
                },
                { needsRender: false, renderer: null }),
            filter(
                (renderer: IGLRenderer): boolean => {
                    return !!renderer.renderer;
                }));

        this._renderCollection$ = this._renderOperation$.pipe(
            scan(
                (hashes: IGLRenderHashes, operation: IGLRenderHashesOperation): IGLRenderHashes => {
                    return operation(hashes);
                },
                {}),
            share());

        this._renderCamera$ = this._renderCameraOperation$.pipe(
            scan(
                (rc: IRenderCamera, operation: IRenderCameraOperation): IRenderCamera => {
                    return operation(rc);
                },
                { frameId: -1, needsRender: false, perspective: null }));

        this._eraser$ = this._eraserOperation$.pipe(
            startWith(
                (eraser: IEraser): IEraser => {
                    return eraser;
                }),
            scan(
                (eraser: IEraser, operation: IEraserOperation): IEraser => {
                    return operation(eraser);
                },
                { needsRender: false }));

        const renderSubscription = observableCombineLatest(
            this._renderer$,
            this._renderCollection$,
            this._renderCamera$,
            this._eraser$).pipe(
                map(
                    ([renderer, hashes, rc, eraser]: [IGLRenderer, IGLRenderHashes, IRenderCamera, IEraser]): ICombination => {
                        const renders: IGLRender[] = Object.keys(hashes)
                            .map((key: string): IGLRender => {
                                return hashes[key];
                            });

                        return { camera: rc, eraser: eraser, renderer: renderer, renders: renders };
                    }),
                filter(
                    (co: ICombination): boolean => {
                        let needsRender: boolean =
                            co.renderer.needsRender ||
                            co.camera.needsRender ||
                            co.eraser.needsRender;

                        const frameId: number = co.camera.frameId;

                        for (const render of co.renders) {
                            if (render.frameId !== frameId) {
                                return false;
                            }

                            needsRender = needsRender || render.needsRender;
                        }

                        return needsRender;
                    }),
                distinctUntilChanged(
                    (n1: number, n2: number): boolean => {
                        return n1 === n2;
                    },
                    (co: ICombination): number => {
                        return co.eraser.needsRender ? -1 : co.camera.frameId;
                    }))
            .subscribe(
                (co: ICombination): void => {
                    co.renderer.needsRender = false;
                    co.camera.needsRender = false;
                    co.eraser.needsRender = false;

                    const perspectiveCamera = co.camera.perspective;

                    const backgroundRenders: IGLRenderFunction[] = [];
                    const foregroundRenders: IGLRenderFunction[] = [];

                    for (const render of co.renders) {
                        if (render.stage === GLRenderStage.Background) {
                            backgroundRenders.push(render.render);
                        } else if (render.stage === GLRenderStage.Foreground) {
                            foregroundRenders.push(render.render);
                        }
                    }

                    const renderer = co.renderer.renderer;
                    renderer.clear();

                    for (const render of backgroundRenders) {
                        render(perspectiveCamera, renderer);
                    }

                    renderer.clearDepth();

                    for (const render of foregroundRenders) {
                        render(perspectiveCamera, renderer);
                    }
                });

        subs.push(renderSubscription);
        subs.push(this._renderFrame$.pipe(
            map(
                (rc: RenderCamera): IRenderCameraOperation => {
                    return (irc: IRenderCamera): IRenderCamera => {
                        irc.frameId = rc.frameId;
                        irc.perspective = rc.perspective;

                        if (rc.changed === true) {
                            irc.needsRender = true;
                        }

                        return irc;
                    };
                }))
            .subscribe(this._renderCameraOperation$));

        this._renderFrameSubscribe();

        const renderHash$ = this._render$.pipe(
            map(
                (hash: IGLRenderHash) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        hashes[hash.name] = hash.render;

                        return hashes;
                    };
                }));

        const clearHash$ = this._clear$.pipe(
            map(
                (name: string) => {
                    return (hashes: IGLRenderHashes): IGLRenderHashes => {
                        delete hashes[name];

                        return hashes;
                    };
                }));

        subs.push(observableMerge(renderHash$, clearHash$)
            .subscribe(this._renderOperation$));

        this._webGLRenderer$ = this._render$.pipe(
            first(),
            map(
                (): THREE.WebGLRenderer => {
                    const canvas = this._dom
                        .createElement("canvas", "mapillary-js-canvas");
                    canvas.style.position = "absolute";
                    canvas.setAttribute("tabindex", "0");
                    canvasContainer.appendChild(canvas);

                    const element = renderService.element;
                    const webGLRenderer = new THREE.WebGLRenderer({ canvas: canvas });
                    webGLRenderer.setPixelRatio(window.devicePixelRatio);
                    webGLRenderer.setSize(element.offsetWidth, element.offsetHeight);
                    webGLRenderer.setClearColor(new THREE.Color(0x0F0F0F), 1.0);
                    webGLRenderer.autoClear = false;

                    return webGLRenderer;
                }),
            publishReplay(1),
            refCount());

        subs.push(this._webGLRenderer$
            .subscribe(() => { /*noop*/ }));

        const createRenderer$ = this._webGLRenderer$.pipe(
            first(),
            map(
                (webGLRenderer: THREE.WebGLRenderer): IGLRendererOperation => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        renderer.needsRender = true;
                        renderer.renderer = webGLRenderer;

                        return renderer;
                    };
                }));

        const resizeRenderer$ = this._renderService.size$.pipe(
            map(
                (size: ISize): IGLRendererOperation => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        if (renderer.renderer == null) {
                            return renderer;
                        }

                        renderer.renderer.setSize(size.width, size.height);
                        renderer.needsRender = true;

                        return renderer;
                    };
                }));

        const clearRenderer$ = this._clear$.pipe(
            map(
                () => {
                    return (renderer: IGLRenderer): IGLRenderer => {
                        if (renderer.renderer == null) {
                            return renderer;
                        }

                        renderer.needsRender = true;

                        return renderer;
                    };
                }));

        subs.push(observableMerge(
            createRenderer$,
            resizeRenderer$,
            clearRenderer$)
            .subscribe(this._rendererOperation$));

        const renderCollectionEmpty$ = this._renderCollection$.pipe(
            filter(
                (hashes: IGLRenderHashes): boolean => {
                    return Object.keys(hashes).length === 0;
                }),
            share());

        subs.push(renderCollectionEmpty$
            .subscribe(
                (): void => {
                    if (this._renderFrameSubscription == null) {
                        return;
                    }

                    this._renderFrameSubscription.unsubscribe();
                    this._renderFrameSubscription = null;

                    this._renderFrameSubscribe();
                }));

        subs.push(renderCollectionEmpty$.pipe(
            map(
                (): IEraserOperation => {
                    return (eraser: IEraser): IEraser => {
                        eraser.needsRender = true;

                        return eraser;
                    };
                }))
            .subscribe(this._eraserOperation$));
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

    public remove(): void {
        this._rendererOperation$.next(
            (renderer: IGLRenderer): IGLRenderer => {
                if (renderer.renderer != null) {
                    const extension = renderer.renderer
                        .getContext()
                        .getExtension('WEBGL_lose_context');
                    if (!!extension) {
                        extension.loseContext();
                    }

                    renderer.renderer = null;
                }

                return renderer;
            });

        if (this._renderFrameSubscription != null) {
            this._renderFrameSubscription.unsubscribe();
        }

        this._subscriptions.unsubscribe();
    }

    private _renderFrameSubscribe(): void {
        this._render$.pipe(
            first(),
            map(
                (): IRenderCameraOperation => {
                    return (irc: IRenderCamera): IRenderCamera => {
                        irc.needsRender = true;

                        return irc;
                    };
                }))
            .subscribe(
                (operation: IRenderCameraOperation): void => {
                    this._renderCameraOperation$.next(operation);
                });

        this._renderFrameSubscription = this._render$.pipe(
            first(),
            mergeMap(
                (): Observable<RenderCamera> => {
                    return this._renderService.renderCameraFrame$;
                }))
            .subscribe(this._renderFrame$);
    }
}

export default GLRenderer;
