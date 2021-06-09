import * as THREE from "three";

import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    Observable,
    Subject,
} from "rxjs";

import {
    catchError,
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    pairwise,
    publishReplay,
    refCount,
    scan,
    share,
    startWith,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import { Component } from "../Component";
import { Image as ImageNode } from "../../graph/Image";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ImageGLRenderer } from "./ImageGLRenderer";
import { Spatial } from "../../geo/Spatial";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { RenderPass } from "../../render/RenderPass";
import { GLRenderHash } from "../../render/interfaces/IGLRenderHash";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { RenderCamera } from "../../render/RenderCamera";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { TileLoader } from "../../tile/TileLoader";
import { TileStore } from "../../tile/TileStore";
import { TileRegionOfInterest }
    from "../../tile/interfaces/TileRegionOfInterest";
import { RegionOfInterestCalculator }
    from "../../tile/RegionOfInterestCalculator";
import { TextureProvider } from "../../tile/TextureProvider";
import { ComponentConfiguration } from "../interfaces/ComponentConfiguration";
import { Transform } from "../../geo/Transform";
import { ComponentName } from "../ComponentName";
import { State } from "../../state/State";

interface ImageGLRendererOperation {
    (renderer: ImageGLRenderer): ImageGLRenderer;
}

type PositionLookat = {
    camera: RenderCamera,
    height: number,
    lookat: THREE.Vector3,
    width: number,
    zoom: number,
};
type TextureProviderInput = [AnimationFrame, THREE.WebGLRenderer];
type RoiTrigger = [StalledCamera, ViewportSize, Transform];
type StalledCamera = {
    camera: RenderCamera,
    stalled: boolean,
};

export class ImageComponent extends Component<ComponentConfiguration> {
    public static componentName: ComponentName = "image";

    private _rendererOperation$: Subject<ImageGLRendererOperation>;
    private _renderer$: Observable<ImageGLRenderer>;
    private _rendererCreator$: Subject<void>;
    private _rendererDisposer$: Subject<void>;

    private _imageTileLoader: TileLoader;
    private _roiCalculator: RegionOfInterestCalculator;

    constructor(
        name: string,
        container: Container,
        navigator: Navigator) {

        super(name, container, navigator);

        this._imageTileLoader = new TileLoader(navigator.api);
        this._roiCalculator = new RegionOfInterestCalculator();

        this._rendererOperation$ = new Subject<ImageGLRendererOperation>();
        this._rendererCreator$ = new Subject<void>();
        this._rendererDisposer$ = new Subject<void>();

        this._renderer$ = this._rendererOperation$.pipe(
            scan(
                (renderer: ImageGLRenderer, operation: ImageGLRendererOperation): ImageGLRenderer => {
                    return operation(renderer);
                },
                null),
            filter(
                (renderer: ImageGLRenderer): boolean => {
                    return renderer != null;
                }),
            distinctUntilChanged(
                undefined,
                (renderer: ImageGLRenderer): number => {
                    return renderer.frameId;
                }));

        this._rendererCreator$.pipe(
            map(
                (): ImageGLRendererOperation => {
                    return (renderer: ImageGLRenderer): ImageGLRenderer => {
                        if (renderer != null) {
                            throw new Error("Multiple image plane states can not be created at the same time");
                        }

                        return new ImageGLRenderer();
                    };
                }))
            .subscribe(this._rendererOperation$);

        this._rendererDisposer$.pipe(
            map(
                (): ImageGLRendererOperation => {
                    return (renderer: ImageGLRenderer): ImageGLRenderer => {
                        renderer.dispose();

                        return null;
                    };
                }))
            .subscribe(this._rendererOperation$);
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        subs.push(this._renderer$.pipe(
            map(
                (renderer: ImageGLRenderer): GLRenderHash => {
                    const renderHash: GLRenderHash = {
                        name: this._name,
                        renderer: {
                            frameId: renderer.frameId,
                            needsRender: renderer.needsRender,
                            render: renderer.render.bind(renderer),
                            pass: RenderPass.Background,
                        },
                    };

                    renderer.clearNeedsRender();

                    return renderHash;
                }))
            .subscribe(this._container.glRenderer.render$));

        this._rendererCreator$.next(null);

        subs.push(this._navigator.stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): ImageGLRendererOperation => {
                    return (renderer: ImageGLRenderer): ImageGLRenderer => {
                        renderer.updateFrame(frame);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$));

        const textureProvider$ =
            this._container.configurationService.imageTiling$.pipe(
                switchMap(
                    (active): Observable<AnimationFrame> => {
                        return active ?
                            this._navigator.stateService.currentState$ :
                            new Subject();
                    }),
                distinctUntilChanged(
                    undefined,
                    (frame: AnimationFrame): string => {
                        return frame.state.currentImage.id;
                    }),
                withLatestFrom(
                    this._container.glRenderer.webGLRenderer$),
                map(
                    ([frame, renderer]: TextureProviderInput)
                        : TextureProvider => {
                        const state = frame.state;
                        const currentNode = state.currentImage;
                        const currentTransform = state.currentTransform;

                        return new TextureProvider(
                            currentNode.id,
                            currentTransform.basicWidth,
                            currentTransform.basicHeight,
                            currentNode.image,
                            this._imageTileLoader,
                            new TileStore(),
                            renderer);
                    }),
                publishReplay(1),
                refCount());

        subs.push(textureProvider$.subscribe(() => { /*noop*/ }));

        subs.push(textureProvider$.pipe(
            map(
                (provider: TextureProvider): ImageGLRendererOperation => {
                    return (renderer: ImageGLRenderer): ImageGLRenderer => {
                        renderer.setTextureProvider(provider.id, provider);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$));

        subs.push(textureProvider$.pipe(
            pairwise())
            .subscribe(
                (pair: [TextureProvider, TextureProvider]): void => {
                    const previous = pair[0];
                    previous.abort();
                }));

        const roiTrigger$ =
            this._container.configurationService.imageTiling$.pipe(
                switchMap(
                    (active): Observable<[State, boolean]> => {
                        return active ?
                            observableCombineLatest(
                                this._navigator.stateService.state$,
                                this._navigator.stateService.inTranslation$) :
                            new Subject();
                    }),
                switchMap(
                    ([state, inTranslation]: [State, boolean]) => {
                        const streetState =
                            state === State.Traversing ||
                            state === State.Waiting ||
                            state === State.WaitingInteractively;
                        const active = streetState && !inTranslation;
                        return active ?
                            this._container.renderService.renderCameraFrame$ :
                            observableEmpty();
                    }),
                map(
                    (camera: RenderCamera): PositionLookat => {
                        return {
                            camera,
                            height: camera.size.height.valueOf(),
                            lookat: camera.camera.lookat.clone(),
                            width: camera.size.width.valueOf(),
                            zoom: camera.zoom.valueOf(),
                        };
                    }),
                pairwise(),
                map(
                    ([pl0, pl1]: [PositionLookat, PositionLookat])
                        : StalledCamera => {
                        const stalled =
                            pl0.width === pl1.width &&
                            pl0.height === pl1.height &&
                            pl0.zoom === pl1.zoom &&
                            pl0.lookat.equals(pl1.lookat);

                        return { camera: pl1.camera, stalled };
                    }),
                distinctUntilChanged(
                    (x, y): boolean => {
                        return x.stalled === y.stalled;
                    }),
                filter(
                    (camera: StalledCamera): boolean => {
                        return camera.stalled;
                    }),
                withLatestFrom(
                    this._container.renderService.size$,
                    this._navigator.stateService.currentTransform$));

        subs.push(textureProvider$.pipe(
            switchMap(
                (provider: TextureProvider):
                    Observable<[TileRegionOfInterest, TextureProvider]> => {
                    return roiTrigger$.pipe(
                        map(
                            ([stalled, size, transform]: RoiTrigger)
                                : [TileRegionOfInterest, TextureProvider] => {

                                const camera = stalled.camera;
                                const basic = new ViewportCoords()
                                    .viewportToBasic(
                                        0,
                                        0,
                                        transform,
                                        camera.perspective);

                                if (basic[0] < 0 ||
                                    basic[1] < 0 ||
                                    basic[0] > 1 ||
                                    basic[1] > 1) {
                                    return undefined;
                                }

                                return [
                                    this._roiCalculator
                                        .computeRegionOfInterest(
                                            camera,
                                            size,
                                            transform),
                                    provider,
                                ];
                            }),
                        filter(
                            (args: [TileRegionOfInterest, TextureProvider]): boolean => {
                                return !!args;
                            }));
                }),
            filter(
                (args: [TileRegionOfInterest, TextureProvider]): boolean => {
                    return !args[1].disposed;
                }))
            .subscribe(
                ([roi, provider]: [TileRegionOfInterest, TextureProvider])
                    : void => {
                    provider.setRegionOfInterest(roi);
                }));

        const hasTexture$ = textureProvider$
            .pipe(
                switchMap(
                    (provider: TextureProvider): Observable<boolean> => {
                        return provider.hasTexture$;
                    }),
                startWith(false),
                publishReplay(1),
                refCount());

        subs.push(hasTexture$.subscribe(() => { /*noop*/ }));

        subs.push(this._navigator.panService.panImages$.pipe(
            filter(
                (panNodes: []): boolean => {
                    return panNodes.length === 0;
                }),
            map(
                (): ImageGLRendererOperation => {
                    return (renderer: ImageGLRenderer): ImageGLRenderer => {
                        renderer.clearPeripheryPlanes();

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$));

        const cachedPanNodes$ = this._navigator.panService.panImages$.pipe(
            switchMap(
                (nts: [ImageNode, Transform, number][]): Observable<[ImageNode, Transform]> => {
                    return observableFrom(nts).pipe(
                        mergeMap(
                            ([n, t]: [ImageNode, Transform, number]): Observable<[ImageNode, Transform]> => {
                                return observableCombineLatest(
                                    this._navigator.graphService.cacheImage$(n.id).pipe(
                                        catchError(
                                            (error: Error): Observable<ImageNode> => {
                                                console.error(`Failed to cache periphery image (${n.id})`, error);

                                                return observableEmpty();
                                            })),
                                    observableOf(t));
                            }));
                }),
            share());

        subs.push(cachedPanNodes$.pipe(
            map(
                ([n, t]: [ImageNode, Transform]): ImageGLRendererOperation => {
                    return (renderer: ImageGLRenderer): ImageGLRenderer => {
                        renderer.addPeripheryPlane(n, t);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$));

        subs.push(cachedPanNodes$.pipe(
            mergeMap(
                ([n]: [ImageNode, Transform]): Observable<ImageNode> => {
                    return n.cacheImage$().pipe(
                        catchError(
                            (): Observable<ImageNode> => {
                                return observableEmpty();
                            }));
                }),
            map(
                (n: ImageNode): ImageGLRendererOperation => {
                    return (renderer: ImageGLRenderer): ImageGLRenderer => {
                        renderer.updateTextureImage(n.image, n);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$));

        const inTransition$ = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): boolean => {
                    return frame.state.alpha < 1;
                }),
            distinctUntilChanged());

        const panTrigger$ = observableCombineLatest(
            this._container.mouseService.active$,
            this._container.touchService.active$,
            this._navigator.stateService.inMotion$,
            inTransition$).pipe(
                map(
                    ([mouseActive, touchActive, inMotion, inTransition]: [boolean, boolean, boolean, boolean]): boolean => {
                        return !(mouseActive || touchActive || inMotion || inTransition);
                    }),
                filter(
                    (trigger: boolean): boolean => {
                        return trigger;
                    }));

        subs.push(this._navigator.stateService.state$
            .pipe(
                switchMap(
                    state => {
                        return state === State.Traversing ?
                            this._navigator.panService.panImages$ :
                            observableEmpty();

                    }),
                switchMap(
                    (nts: [ImageNode, Transform, number][]):
                        Observable<[RenderCamera, ImageNode, Transform, [ImageNode, Transform, number][]]> => {

                        return panTrigger$.pipe(
                            withLatestFrom(
                                this._container.renderService.renderCamera$,
                                this._navigator.stateService.currentImage$,
                                this._navigator.stateService.currentTransform$),
                            mergeMap(
                                ([, renderCamera, currentNode, currentTransform]: [boolean, RenderCamera, ImageNode, Transform]):
                                    Observable<[RenderCamera, ImageNode, Transform, [ImageNode, Transform, number][]]> => {
                                    return observableOf(
                                        [
                                            renderCamera,
                                            currentNode,
                                            currentTransform,
                                            nts,
                                        ] as [RenderCamera, ImageNode, Transform, [ImageNode, Transform, number][]]);
                                }));
                    }),
                switchMap(
                    ([camera, cn, ct, nts]:
                        [
                            RenderCamera,
                            ImageNode,
                            Transform,
                            [ImageNode, Transform, number][],
                        ]): Observable<ImageNode> => {

                        const direction = camera.camera.lookat.clone().sub(camera.camera.position);

                        const cd = new Spatial().viewingDirection(cn.rotation);
                        const ca = cd.angleTo(direction);
                        const closest: [number, string] = [ca, undefined];
                        const basic = new ViewportCoords().viewportToBasic(0, 0, ct, camera.perspective);

                        if (basic[0] >= 0 && basic[0] <= 1 && basic[1] >= 0 && basic[1] <= 1) {
                            closest[0] = Number.NEGATIVE_INFINITY;
                        }

                        for (const [n] of nts) {
                            const d = new Spatial().viewingDirection(n.rotation);
                            const a = d.angleTo(direction);

                            if (a < closest[0]) {
                                closest[0] = a;
                                closest[1] = n.id;
                            }
                        }

                        if (!closest[1]) {
                            return observableEmpty();
                        }

                        return this._navigator.moveTo$(closest[1]).pipe(
                            catchError(
                                (): Observable<ImageNode> => {
                                    return observableEmpty();
                                }));
                    }))
            .subscribe());
    }

    protected _deactivate(): void {
        this._rendererDisposer$.next(null);
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): ComponentConfiguration {
        return {};
    }
}
