import * as THREE from "three";

import {
    combineLatest as observableCombineLatest,
    merge as observableMerge,
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
    skip,
    startWith,
} from "rxjs/operators";

import { GLRenderStage } from "./GLRenderStage";
import { RenderCamera } from "./RenderCamera";
import { RenderService } from "./RenderService";
import { IGLRender } from "./interfaces/IGLRender";
import { IGLRenderFunction } from "./interfaces/IGLRenderFunction";
import { IGLRenderHash } from "./interfaces/IGLRenderHash";
import { ISize } from "./interfaces/ISize";

import { SubscriptionHolder } from "../utils/SubscriptionHolder";

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

interface IForce {
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

interface IForceOperation {
    (forcer: IForce): IForce;
}

interface ICombination {
    camera: IRenderCamera;
    eraser: IForce;
    trigger: IForce;
    renderer: IGLRenderer;
    renders: IGLRender[];
}

export class GLRenderer {
    private _renderService: RenderService;

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

    private _eraserOperation$: Subject<IForceOperation> = new Subject<IForceOperation>();
    private _eraser$: Observable<IForce>;

    private _triggerOperation$: Subject<IForceOperation> = new Subject<IForceOperation>();

    private _webGLRenderer$: Observable<THREE.WebGLRenderer>;

    private _renderFrameSubscription: Subscription;
    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    private _postrender$: Subject<void> = new Subject<void>();

    constructor(
        canvas: HTMLCanvasElement,
        canvasContainer: HTMLElement,
        renderService: RenderService) {
        this._renderService = renderService;
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
                (eraser: IForce): IForce => {
                    return eraser;
                }),
            scan(
                (eraser: IForce, operation: IForceOperation): IForce => {
                    return operation(eraser);
                },
                { needsRender: false }));

        const trigger$ = this._triggerOperation$.pipe(
            startWith(
                (trigger: IForce): IForce => {
                    return trigger;
                }),
            scan(
                (trigger: IForce, operation: IForceOperation): IForce => {
                    return operation(trigger);
                },
                { needsRender: false }));

        const clearColor = new THREE.Color(0x0F0F0F);
        const renderSubscription = observableCombineLatest(
            this._renderer$,
            this._renderCollection$,
            this._renderCamera$,
            this._eraser$,
            trigger$).pipe(
                map(
                    ([renderer, hashes, rc, eraser, trigger]:
                        [IGLRenderer, IGLRenderHashes, IRenderCamera, IForce, IForce]): ICombination => {
                        const renders: IGLRender[] = Object.keys(hashes)
                            .map((key: string): IGLRender => {
                                return hashes[key];
                            });

                        return { camera: rc, eraser: eraser, trigger: trigger, renderer: renderer, renders: renders };
                    }),
                filter(
                    (co: ICombination): boolean => {
                        let needsRender: boolean =
                            co.renderer.needsRender ||
                            co.camera.needsRender ||
                            co.eraser.needsRender ||
                            co.trigger.needsRender;

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
                        return co.eraser.needsRender ||
                            co.trigger.needsRender ? -co.camera.frameId : co.camera.frameId;
                    }))
            .subscribe(
                (co: ICombination): void => {
                    co.renderer.needsRender = false;
                    co.camera.needsRender = false;
                    co.eraser.needsRender = false;
                    co.trigger.needsRender = false;

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
                    renderer.resetState();
                    renderer.setClearColor(clearColor, 1.0);
                    renderer.clear();

                    for (const render of backgroundRenders) {
                        render(perspectiveCamera, renderer);
                    }

                    renderer.clearDepth();

                    for (const render of foregroundRenders) {
                        render(perspectiveCamera, renderer);
                    }

                    this._postrender$.next();
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
                    canvasContainer.appendChild(canvas);
                    const element = renderService.element;
                    const webGLRenderer = new THREE.WebGLRenderer({ canvas: canvas });
                    webGLRenderer.setPixelRatio(window.devicePixelRatio);
                    webGLRenderer.setSize(element.offsetWidth, element.offsetHeight);
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
                (): IForceOperation => {
                    return (eraser: IForce): IForce => {
                        eraser.needsRender = true;

                        return eraser;
                    };
                }))
            .subscribe(this._eraserOperation$));
    }

    public get render$(): Subject<IGLRenderHash> {
        return this._render$;
    }

    public get postrender$(): Observable<void> {
        return this._postrender$;
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

    public triggerRerender(): void {
        this._renderService.renderCameraFrame$
            .pipe(
                skip(1),
                first())
            .subscribe(
                (): void => {
                    this._triggerOperation$.next(
                        (trigger: IForce): IForce => {
                            trigger.needsRender = true;
                            return trigger;
                        });
                });
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
