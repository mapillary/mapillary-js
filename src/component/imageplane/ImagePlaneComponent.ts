import * as THREE from "three";

import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    Observable,
    Subscription,
    Subject,
} from "rxjs";

import {
    catchError,
    distinctUntilChanged,
    filter,
    first,
    debounceTime,
    map,
    mergeMap,
    pairwise,
    publish,
    publishReplay,
    refCount,
    scan,
    share,
    skipWhile,
    startWith,
    switchMap,
    takeUntil,
    withLatestFrom,
} from "rxjs/operators";

import { Component } from "../Component";
import { Node as GraphNode } from "../../graph/Node";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ImagePlaneGLRenderer } from "./ImagePlaneGLRenderer";
import { Spatial } from "../../geo/Spatial";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { GLRenderStage } from "../../render/GLRenderStage";
import { GLRenderHash } from "../../render/interfaces/IGLRenderHash";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { RenderCamera } from "../../render/RenderCamera";
import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { ImageTileLoader } from "../../tiles/ImageTileLoader";
import { ImageTileStore } from "../../tiles/ImageTileStore";
import { TileRegionOfInterest } from "../../tiles/interfaces/TileRegionOfInterest";
import { RegionOfInterestCalculator } from "../../tiles/RegionOfInterestCalculator";
import { TextureProvider } from "../../tiles/TextureProvider";
import { Settings } from "../../utils/Settings";
import { ComponentConfiguration } from "../interfaces/ComponentConfiguration";
import { Transform } from "../../geo/Transform";
import { ImageSize } from "../../viewer/ImageSize";
import { isSpherical } from "../../geo/Geo";


interface ImagePlaneGLRendererOperation {
    (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer;
}

type PositionLookat = [THREE.Vector3, THREE.Vector3, number, number, number];

export class ImagePlaneComponent extends Component<ComponentConfiguration> {
    public static componentName: string = "imagePlane";

    private _rendererOperation$: Subject<ImagePlaneGLRendererOperation>;
    private _renderer$: Observable<ImagePlaneGLRenderer>;
    private _rendererCreator$: Subject<void>;
    private _rendererDisposer$: Subject<void>;

    private _abortTextureProviderSubscription: Subscription;
    private _hasTextureSubscription: Subscription;
    private _rendererSubscription: Subscription;
    private _setRegionOfInterestSubscription: Subscription;
    private _setTextureProviderSubscription: Subscription;
    private _setTileSizeSubscription: Subscription;
    private _stateSubscription: Subscription;
    private _textureProviderSubscription: Subscription;
    private _updateBackgroundSubscription: Subscription;
    private _updateTextureImageSubscription: Subscription;

    private _clearPeripheryPlaneSubscription: Subscription;
    private _addPeripheryPlaneSubscription: Subscription;
    private _updatePeripheryPlaneTextureSubscription: Subscription;
    private _moveToPeripheryNodeSubscription: Subscription;

    private _imageTileLoader: ImageTileLoader;
    private _roiCalculator: RegionOfInterestCalculator;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._imageTileLoader = new ImageTileLoader(navigator.api.data);
        this._roiCalculator = new RegionOfInterestCalculator();

        this._rendererOperation$ = new Subject<ImagePlaneGLRendererOperation>();
        this._rendererCreator$ = new Subject<void>();
        this._rendererDisposer$ = new Subject<void>();

        this._renderer$ = this._rendererOperation$.pipe(
            scan(
                (renderer: ImagePlaneGLRenderer, operation: ImagePlaneGLRendererOperation): ImagePlaneGLRenderer => {
                    return operation(renderer);
                },
                null),
            filter(
                (renderer: ImagePlaneGLRenderer): boolean => {
                    return renderer != null;
                }),
            distinctUntilChanged(
                undefined,
                (renderer: ImagePlaneGLRenderer): number => {
                    return renderer.frameId;
                }));

        this._rendererCreator$.pipe(
            map(
                (): ImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        if (renderer != null) {
                            throw new Error("Multiple image plane states can not be created at the same time");
                        }

                        return new ImagePlaneGLRenderer();
                    };
                }))
            .subscribe(this._rendererOperation$);

        this._rendererDisposer$.pipe(
            map(
                (): ImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.dispose();

                        return null;
                    };
                }))
            .subscribe(this._rendererOperation$);
    }

    protected _activate(): void {
        this._rendererSubscription = this._renderer$.pipe(
            map(
                (renderer: ImagePlaneGLRenderer): GLRenderHash => {
                    let renderHash: GLRenderHash = {
                        name: this._name,
                        renderer: {
                            frameId: renderer.frameId,
                            needsRender: renderer.needsRender,
                            render: renderer.render.bind(renderer),
                            stage: GLRenderStage.Background,
                        },
                    };

                    renderer.clearNeedsRender();

                    return renderHash;
                }))
            .subscribe(this._container.glRenderer.render$);

        this._rendererCreator$.next(null);

        this._stateSubscription = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): ImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateFrame(frame);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);

        let textureProvider$: Observable<TextureProvider> = this._navigator.stateService.currentState$.pipe(
            distinctUntilChanged(
                undefined,
                (frame: AnimationFrame): string => {
                    return frame.state.currentNode.key;
                }),
            withLatestFrom(
                this._container.glRenderer.webGLRenderer$,
                this._container.renderService.size$),
            map(
                ([frame, renderer, size]: [AnimationFrame, THREE.WebGLRenderer, ViewportSize]): TextureProvider => {
                    let state: IAnimationState = frame.state;
                    let viewportSize: number = Math.max(size.width, size.height);

                    let currentNode: GraphNode = state.currentNode;
                    let currentTransform: Transform = state.currentTransform;
                    let tileSize: number = viewportSize > 2048 ? 2048 : viewportSize > 1024 ? 1024 : 512;

                    return new TextureProvider(
                        currentNode.key,
                        currentTransform.basicWidth,
                        currentTransform.basicHeight,
                        tileSize,
                        currentNode.image,
                        this._imageTileLoader,
                        new ImageTileStore(),
                        renderer);
                }),
            publishReplay(1),
            refCount());

        this._textureProviderSubscription = textureProvider$.subscribe(() => { /*noop*/ });

        this._setTextureProviderSubscription = textureProvider$.pipe(
            map(
                (provider: TextureProvider): ImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.setTextureProvider(provider.key, provider);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);

        this._setTileSizeSubscription = this._container.renderService.size$.pipe(
            switchMap(
                (size: ViewportSize): Observable<[TextureProvider, ViewportSize]> => {
                    return observableCombineLatest(
                        textureProvider$,
                        observableOf<ViewportSize>(size)).pipe(
                            first());
                }))
            .subscribe(
                ([provider, size]: [TextureProvider, ViewportSize]): void => {
                    let viewportSize: number = Math.max(size.width, size.height);
                    let tileSize: number = viewportSize > 2048 ? 2048 : viewportSize > 1024 ? 1024 : 512;

                    provider.setTileSize(tileSize);
                });

        this._abortTextureProviderSubscription = textureProvider$.pipe(
            pairwise())
            .subscribe(
                (pair: [TextureProvider, TextureProvider]): void => {
                    let previous: TextureProvider = pair[0];
                    previous.abort();
                });

        let roiTrigger$: Observable<[RenderCamera, ViewportSize, Transform]> = observableCombineLatest(
            this._container.renderService.renderCameraFrame$,
            this._container.renderService.size$.pipe(debounceTime(250))).pipe(
                map(
                    ([camera, size]: [RenderCamera, ViewportSize]): PositionLookat => {
                        return [
                            camera.camera.position.clone(),
                            camera.camera.lookat.clone(),
                            camera.zoom.valueOf(),
                            size.height.valueOf(),
                            size.width.valueOf()];
                    }),
                pairwise(),
                skipWhile(
                    (pls: [PositionLookat, PositionLookat]): boolean => {
                        return pls[1][2] - pls[0][2] < 0 || pls[1][2] === 0;
                    }),
                map(
                    (pls: [PositionLookat, PositionLookat]): boolean => {
                        let samePosition: boolean = pls[0][0].equals(pls[1][0]);
                        let sameLookat: boolean = pls[0][1].equals(pls[1][1]);
                        let sameZoom: boolean = pls[0][2] === pls[1][2];
                        let sameHeight: boolean = pls[0][3] === pls[1][3];
                        let sameWidth: boolean = pls[0][4] === pls[1][4];

                        return samePosition && sameLookat && sameZoom && sameHeight && sameWidth;
                    }),
                distinctUntilChanged(),
                filter(
                    (stalled: boolean): boolean => {
                        return stalled;
                    }),
                switchMap(
                    (): Observable<RenderCamera> => {
                        return this._container.renderService.renderCameraFrame$.pipe(
                            first());
                    }),
                withLatestFrom(
                    this._container.renderService.size$,
                    this._navigator.stateService.currentTransform$));

        this._setRegionOfInterestSubscription = textureProvider$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<[TileRegionOfInterest, TextureProvider]> => {
                    return roiTrigger$.pipe(
                        map(
                            ([camera, size, transform]: [RenderCamera, ViewportSize, Transform]):
                                [TileRegionOfInterest, TextureProvider] => {
                                const basic: number[] = new ViewportCoords().viewportToBasic(0, 0, transform, camera.perspective);

                                if (basic[0] < 0 || basic[1] < 0 || basic[0] > 1 || basic[1] > 1) {
                                    return undefined;
                                }

                                return [
                                    this._roiCalculator.computeRegionOfInterest(camera, size, transform),
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
                (args: [TileRegionOfInterest, TextureProvider]): void => {
                    let roi: TileRegionOfInterest = args[0];
                    let provider: TextureProvider = args[1];

                    provider.setRegionOfInterest(roi);
                });

        let hasTexture$: Observable<boolean> = textureProvider$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<boolean> => {
                    return provider.hasTexture$;
                }),
            startWith(false),
            publishReplay(1),
            refCount());

        this._hasTextureSubscription = hasTexture$.subscribe(() => { /*noop*/ });

        let nodeImage$: Observable<[HTMLImageElement, GraphNode]> = this._navigator.stateService.currentState$.pipe(
            filter(
                (frame: AnimationFrame): boolean => {
                    return frame.state.nodesAhead === 0;
                }),
            map(
                (frame: AnimationFrame): GraphNode => {
                    return frame.state.currentNode;
                }),
            distinctUntilChanged(
                undefined,
                (node: GraphNode): string => {
                    return node.key;
                }),
            debounceTime(1000),
            withLatestFrom(hasTexture$),
            filter(
                (args: [GraphNode, boolean]): boolean => {
                    return !args[1];
                }),
            map(
                (args: [GraphNode, boolean]): GraphNode => {
                    return args[0];
                }),
            filter(
                (node: GraphNode): boolean => {
                    return isSpherical(node.cameraType) ?
                        Settings.maxImageSize > Settings.baseSphericalSize :
                        Settings.maxImageSize > Settings.baseImageSize;
                }),
            switchMap(
                (node: GraphNode): Observable<[HTMLImageElement, GraphNode]> => {
                    let baseImageSize = isSpherical(node.cameraType) ?
                        Settings.baseSphericalSize :
                        Settings.baseImageSize;

                    if (Math.max(node.image.width, node.image.height) > baseImageSize) {
                        return observableEmpty();
                    }

                    let image$: Observable<[HTMLImageElement, GraphNode]> = node
                        .cacheImage$(Settings.maxImageSize).pipe(
                            map(
                                (n: GraphNode): [HTMLImageElement, GraphNode] => {
                                    return [n.image, n];
                                }));

                    return image$.pipe(
                        takeUntil(
                            hasTexture$.pipe(
                                filter(
                                    (hasTexture: boolean): boolean => {

                                        return hasTexture;
                                    }))),
                        catchError(
                            (error: Error):
                                Observable<[HTMLImageElement, GraphNode]> => {
                                console.error(`Failed to fetch high res image (${node.key})`, error);

                                return observableEmpty();
                            }));
                })).pipe(
                    publish(),
                    refCount());

        this._updateBackgroundSubscription = nodeImage$.pipe(
            withLatestFrom(textureProvider$))
            .subscribe(
                (args: [[HTMLImageElement, GraphNode], TextureProvider]): void => {
                    if (args[0][1].key !== args[1].key ||
                        args[1].disposed) {
                        return;
                    }

                    args[1].updateBackground(args[0][0]);
                });

        this._updateTextureImageSubscription = nodeImage$.pipe(
            map(
                (imn: [HTMLImageElement, GraphNode]): ImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateTextureImage(imn[0], imn[1]);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);

        this._clearPeripheryPlaneSubscription = this._navigator.panService.panNodes$.pipe(
            filter(
                (panNodes: []): boolean => {
                    return panNodes.length === 0;
                }),
            map(
                (): ImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.clearPeripheryPlanes();

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);

        const cachedPanNodes$: Observable<[GraphNode, Transform]> = this._navigator.panService.panNodes$.pipe(
            switchMap(
                (nts: [GraphNode, Transform, number][]): Observable<[GraphNode, Transform]> => {
                    return observableFrom(nts).pipe(
                        mergeMap(
                            ([n, t]: [GraphNode, Transform, number]): Observable<[GraphNode, Transform]> => {
                                return observableCombineLatest(
                                    this._navigator.graphService.cacheNode$(n.key).pipe(
                                        catchError(
                                            (error: Error): Observable<GraphNode> => {
                                                console.error(`Failed to cache periphery node (${n.key})`, error);

                                                return observableEmpty();
                                            })),
                                    observableOf(t));
                            }));
                }),
            share());

        this._addPeripheryPlaneSubscription = cachedPanNodes$.pipe(
            map(
                ([n, t]: [GraphNode, Transform]): ImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.addPeripheryPlane(n, t);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);

        this._updatePeripheryPlaneTextureSubscription = cachedPanNodes$.pipe(
            mergeMap(
                ([n]: [GraphNode, Transform]): Observable<GraphNode> => {
                    return ImageSize.Size2048 > Math.max(n.image.width, n.image.height) ?
                        n.cacheImage$(ImageSize.Size2048).pipe(
                            catchError(
                                (): Observable<GraphNode> => {
                                    return observableEmpty();
                                })) :
                        observableEmpty();
                }),
            map(
                (n: GraphNode): ImagePlaneGLRendererOperation => {
                    return (renderer: ImagePlaneGLRenderer): ImagePlaneGLRenderer => {
                        renderer.updateTextureImage(n.image, n);

                        return renderer;
                    };
                }))
            .subscribe(this._rendererOperation$);

        const inTransition$: Observable<boolean> = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): boolean => {
                    return frame.state.alpha < 1;
                }),
            distinctUntilChanged());

        const panTrigger$: Observable<boolean> = observableCombineLatest(
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

        this._moveToPeripheryNodeSubscription = this._navigator.panService.panNodes$.pipe(
            switchMap(
                (nts: [GraphNode, Transform, number][]):
                    Observable<[RenderCamera, GraphNode, Transform, [GraphNode, Transform, number][]]> => {

                    return panTrigger$.pipe(
                        withLatestFrom(
                            this._container.renderService.renderCamera$,
                            this._navigator.stateService.currentNode$,
                            this._navigator.stateService.currentTransform$),
                        mergeMap(
                            ([, renderCamera, currentNode, currentTransform]: [boolean, RenderCamera, GraphNode, Transform]):
                                Observable<[RenderCamera, GraphNode, Transform, [GraphNode, Transform, number][]]> => {
                                return observableOf(
                                    [
                                        renderCamera,
                                        currentNode,
                                        currentTransform,
                                        nts,
                                    ] as [RenderCamera, GraphNode, Transform, [GraphNode, Transform, number][]]);
                            }));
                }),
            switchMap(
                ([camera, cn, ct, nts]: [RenderCamera, GraphNode, Transform, [GraphNode, Transform, number][]]): Observable<GraphNode> => {
                    const direction: THREE.Vector3 = camera.camera.lookat.clone().sub(camera.camera.position);

                    const cd: THREE.Vector3 = new Spatial().viewingDirection(cn.rotation);
                    const ca: number = cd.angleTo(direction);
                    const closest: [number, string] = [ca, undefined];
                    const basic: number[] = new ViewportCoords().viewportToBasic(0, 0, ct, camera.perspective);

                    if (basic[0] >= 0 && basic[0] <= 1 && basic[1] >= 0 && basic[1] <= 1) {
                        closest[0] = Number.NEGATIVE_INFINITY;
                    }

                    for (const [n] of nts) {
                        const d: THREE.Vector3 = new Spatial().viewingDirection(n.rotation);
                        const a: number = d.angleTo(direction);

                        if (a < closest[0]) {
                            closest[0] = a;
                            closest[1] = n.key;
                        }
                    }

                    if (!closest[1]) {
                        return observableEmpty();
                    }

                    return this._navigator.moveToKey$(closest[1]).pipe(
                        catchError(
                            (): Observable<GraphNode> => {
                                return observableEmpty();
                            }));
                }))
            .subscribe();
    }

    protected _deactivate(): void {
        this._rendererDisposer$.next(null);

        this._abortTextureProviderSubscription.unsubscribe();
        this._hasTextureSubscription.unsubscribe();
        this._rendererSubscription.unsubscribe();
        this._setRegionOfInterestSubscription.unsubscribe();
        this._setTextureProviderSubscription.unsubscribe();
        this._setTileSizeSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
        this._textureProviderSubscription.unsubscribe();
        this._updateBackgroundSubscription.unsubscribe();
        this._updateTextureImageSubscription.unsubscribe();

        this._clearPeripheryPlaneSubscription.unsubscribe();
        this._addPeripheryPlaneSubscription.unsubscribe();
        this._updatePeripheryPlaneTextureSubscription.unsubscribe();
        this._moveToPeripheryNodeSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): ComponentConfiguration {
        return {};
    }
}
