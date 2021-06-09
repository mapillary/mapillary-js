import * as THREE from "three";

import {
    combineLatest as observableCombineLatest,
    concat as observableConcat,
    empty as observableEmpty,
    zip as observableZip,
    Observable,
    Subscription,
    Subject,
} from "rxjs";

import {
    catchError,
    debounceTime,
    distinctUntilChanged,
    filter,
    first,
    map,
    pairwise,
    publishReplay,
    refCount,
    scan,
    skipWhile,
    startWith,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import {
    SliderImages,
    SliderCombination,
    GLRendererOperation,
    PositionLookat,
} from "./interfaces/SliderInterfaces";

import { Image } from "../../graph/Image";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { Spatial } from "../../geo/Spatial";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { RenderPass } from "../../render/RenderPass";
import { GLRenderHash } from "../../render/interfaces/IGLRenderHash";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { RenderCamera } from "../../render/RenderCamera";
import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { State } from "../../state/State";
import { TileLoader } from "../../tile/TileLoader";
import { TileStore } from "../../tile/TileStore";
import { TileBoundingBox } from "../../tile/interfaces/TileBoundingBox";
import { TileRegionOfInterest }
    from "../../tile/interfaces/TileRegionOfInterest";
import { RegionOfInterestCalculator }
    from "../../tile/RegionOfInterestCalculator";
import { TextureProvider } from "../../tile/TextureProvider";
import { Component } from "../Component";
import {
    SliderConfiguration,
    SliderConfigurationMode,
} from "../interfaces/SliderConfiguration";
import { SliderGLRenderer } from "./SliderGLRenderer";
import { Transform } from "../../geo/Transform";
import { SliderDOMRenderer } from "./SliderDOMRenderer";
import { isSpherical } from "../../geo/Geo";
import { ComponentName } from "../ComponentName";

/**
 * @class SliderComponent
 *
 * @classdesc Component for comparing pairs of images. Renders
 * a slider for adjusting the curtain of the first image.
 *
 * Deactivate the sequence, direction and image plane
 * components when activating the slider component to avoid
 * interfering UI elements.
 *
 * To retrive and use the slider component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 *
 * viewer.deactivateComponent("image");
 * viewer.deactivateComponent("direction");
 * viewer.deactivateComponent("sequence");
 *
 * viewer.activateComponent("slider");
 *
 * var sliderComponent = viewer.getComponent("slider");
 * ```
 */
export class SliderComponent extends Component<SliderConfiguration> {
    public static componentName: ComponentName = "slider";

    private _viewportCoords: ViewportCoords;
    private _domRenderer: SliderDOMRenderer;
    private _imageTileLoader: TileLoader;
    private _roiCalculator: RegionOfInterestCalculator;
    private _spatial: Spatial;

    private _glRendererOperation$: Subject<GLRendererOperation>;
    private _glRenderer$: Observable<SliderGLRenderer>;
    private _glRendererCreator$: Subject<void>;
    private _glRendererDisposer$: Subject<void>;

    private _waitSubscription: Subscription;

    /** @ignore */
    constructor(
        name: string,
        container: Container,
        navigator: Navigator,
        viewportCoords?: ViewportCoords) {
        super(name, container, navigator);

        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();
        this._domRenderer = new SliderDOMRenderer(container);
        this._imageTileLoader = new TileLoader(navigator.api);
        this._roiCalculator = new RegionOfInterestCalculator();
        this._spatial = new Spatial();

        this._glRendererOperation$ = new Subject<GLRendererOperation>();
        this._glRendererCreator$ = new Subject<void>();
        this._glRendererDisposer$ = new Subject<void>();

        this._glRenderer$ = this._glRendererOperation$.pipe(
            scan(
                (glRenderer: SliderGLRenderer, operation: GLRendererOperation): SliderGLRenderer => {
                    return operation(glRenderer);
                },
                null),
            filter(
                (glRenderer: SliderGLRenderer): boolean => {
                    return glRenderer != null;
                }),
            distinctUntilChanged(
                undefined,
                (glRenderer: SliderGLRenderer): number => {
                    return glRenderer.frameId;
                }));

        this._glRendererCreator$.pipe(
            map(
                (): GLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        if (glRenderer != null) {
                            throw new Error("Multiple slider states can not be created at the same time");
                        }

                        return new SliderGLRenderer();
                    };
                }))
            .subscribe(this._glRendererOperation$);

        this._glRendererDisposer$.pipe(
            map(
                (): GLRendererOperation => {
                    return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                        glRenderer.dispose();

                        return null;
                    };
                }))
            .subscribe(this._glRendererOperation$);
    }

    protected _activate(): void {
        const subs = this._subscriptions;
        subs.push(this._domRenderer.mode$
            .subscribe(
                (mode: SliderConfigurationMode): void => {
                    this.configure({ mode });
                }));

        subs.push(this._glRenderer$.pipe(
            map(
                (glRenderer: SliderGLRenderer): GLRenderHash => {
                    let renderHash: GLRenderHash = {
                        name: this._name,
                        renderer: {
                            frameId: glRenderer.frameId,
                            needsRender: glRenderer.needsRender,
                            render: glRenderer.render.bind(glRenderer),
                            pass: RenderPass.Background,
                        },
                    };

                    return renderHash;
                }))
            .subscribe(this._container.glRenderer.render$));

        const position$ = observableConcat(
            this.configuration$.pipe(
                map(
                    (configuration: SliderConfiguration): number => {
                        return configuration.initialPosition != null ?
                            configuration.initialPosition : 1;
                    }),
                first()),
            this._domRenderer.position$);

        const mode$ = this.configuration$.pipe(
            map(
                (configuration: SliderConfiguration): SliderConfigurationMode => {
                    return configuration.mode;
                }),
            distinctUntilChanged());

        const motionless$ = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): boolean => {
                    return frame.state.motionless;
                }),
            distinctUntilChanged());

        const spherical$ = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): boolean => {
                    return isSpherical(frame.state.currentImage.cameraType);
                }),
            distinctUntilChanged());

        const sliderVisible$ = observableCombineLatest(
            this._configuration$.pipe(
                map(
                    (configuration: SliderConfiguration): boolean => {
                        return configuration.sliderVisible;
                    })),
            this._navigator.stateService.currentState$.pipe(
                map(
                    (frame: AnimationFrame): boolean => {
                        return !(frame.state.currentImage == null ||
                            frame.state.previousImage == null ||
                            (isSpherical(
                                frame.state.currentImage.cameraType) &&
                                !isSpherical(
                                    frame.state.previousImage.cameraType)));
                    }),
                distinctUntilChanged())).pipe(
                    map(
                        ([sliderVisible, enabledState]: [boolean, boolean]): boolean => {
                            return sliderVisible && enabledState;
                        }),
                    distinctUntilChanged());

        this._waitSubscription = observableCombineLatest(
            mode$,
            motionless$,
            spherical$,
            sliderVisible$).pipe(
                withLatestFrom(this._navigator.stateService.state$))
            .subscribe(
                ([[mode, motionless, spherical, sliderVisible], state]:
                    [[SliderConfigurationMode, boolean, boolean, boolean], State]): void => {
                    const interactive: boolean = sliderVisible &&
                        (motionless ||
                            mode === SliderConfigurationMode.Stationary ||
                            spherical);

                    if (interactive && state !== State.WaitingInteractively) {
                        this._navigator.stateService.waitInteractively();
                    } else if (!interactive && state !== State.Waiting) {
                        this._navigator.stateService.wait();
                    }
                });

        subs.push(observableCombineLatest(
            position$,
            mode$,
            motionless$,
            spherical$,
            sliderVisible$)
            .subscribe(
                ([position, mode, motionless, spherical]: [number, SliderConfigurationMode, boolean, boolean, boolean]): void => {
                    if (motionless || mode === SliderConfigurationMode.Stationary || spherical) {
                        this._navigator.stateService.moveTo(1);
                    } else {
                        this._navigator.stateService.moveTo(position);
                    }
                }));

        subs.push(observableCombineLatest(
            position$,
            mode$,
            motionless$,
            spherical$,
            sliderVisible$,
            this._container.renderService.size$).pipe(
                map(
                    ([position, mode, motionless, spherical, sliderVisible]:
                        [number, SliderConfigurationMode, boolean, boolean, boolean, ViewportSize]): VirtualNodeHash => {
                        return {
                            name: this._name,
                            vNode: this._domRenderer.render(position, mode, motionless, spherical, sliderVisible),
                        };
                    }))
            .subscribe(this._container.domRenderer.render$));

        this._glRendererCreator$.next(null);

        subs.push(observableCombineLatest(
            position$,
            spherical$,
            sliderVisible$,
            this._container.renderService.renderCamera$,
            this._navigator.stateService.currentTransform$).pipe(
                map(
                    ([position, spherical, visible, render, transform]: [number, boolean, boolean, RenderCamera, Transform]): number => {
                        if (!spherical) {
                            return visible ? position : 1;
                        }

                        const basicMin: number[] = this._viewportCoords.viewportToBasic(-1.15, 0, transform, render.perspective);
                        const basicMax: number[] = this._viewportCoords.viewportToBasic(1.15, 0, transform, render.perspective);

                        const shiftedMax: number = basicMax[0] < basicMin[0] ? basicMax[0] + 1 : basicMax[0];
                        const basicPosition: number = basicMin[0] + position * (shiftedMax - basicMin[0]);

                        return basicPosition > 1 ? basicPosition - 1 : basicPosition;
                    }),
                map(
                    (position: number): GLRendererOperation => {
                        return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                            glRenderer.updateCurtain(position);

                            return glRenderer;
                        };
                    }))
            .subscribe(this._glRendererOperation$));

        subs.push(observableCombineLatest(
            this._navigator.stateService.currentState$,
            mode$).pipe(
                map(
                    ([frame, mode]: [AnimationFrame, SliderConfigurationMode]): GLRendererOperation => {
                        return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                            glRenderer.update(frame, mode);

                            return glRenderer;
                        };
                    }))
            .subscribe(this._glRendererOperation$));

        subs.push(this._configuration$.pipe(
            filter(
                (configuration: SliderConfiguration): boolean => {
                    return configuration.ids != null;
                }),
            switchMap(
                (configuration: SliderConfiguration): Observable<SliderCombination> => {
                    return observableZip(
                        observableZip(
                            this._catchCacheImage$(
                                configuration.ids.background),
                            this._catchCacheImage$(
                                configuration.ids.foreground)).pipe(
                                    map(
                                        (images: [Image, Image])
                                            : SliderImages => {
                                            return { background: images[0], foreground: images[1] };
                                        })),
                        this._navigator.stateService.currentState$.pipe(first())).pipe(
                            map(
                                (nf: [SliderImages, AnimationFrame]): SliderCombination => {
                                    return { images: nf[0], state: nf[1].state };
                                }));
                }))
            .subscribe(
                (co: SliderCombination): void => {
                    if (co.state.currentImage != null &&
                        co.state.previousImage != null &&
                        co.state.currentImage.id === co.images.foreground.id &&
                        co.state.previousImage.id === co.images.background.id) {
                        return;
                    }

                    if (co.state.currentImage.id === co.images.background.id) {
                        this._navigator.stateService.setImages([co.images.foreground]);
                        return;
                    }

                    if (co.state.currentImage.id === co.images.foreground.id &&
                        co.state.trajectory.length === 1) {
                        this._navigator.stateService.prependImages([co.images.background]);
                        return;
                    }

                    this._navigator.stateService.setImages([co.images.background]);
                    this._navigator.stateService.setImages([co.images.foreground]);
                },
                (e: Error): void => {
                    console.error(e);
                }));


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
                    this._container.glRenderer.webGLRenderer$,
                    this._container.renderService.size$),
                map(
                    ([frame, renderer, size]: [AnimationFrame, THREE.WebGLRenderer, ViewportSize]): TextureProvider => {
                        const state: IAnimationState = frame.state;
                        const viewportSize: number = Math.max(size.width, size.height);

                        const currentImage: Image = state.currentImage;
                        const currentTransform: Transform = state.currentTransform;
                        const tileSize: number = viewportSize > 2048 ? 2048 : viewportSize > 1024 ? 1024 : 512;

                        return new TextureProvider(
                            currentImage.id,
                            currentTransform.basicWidth,
                            currentTransform.basicHeight,
                            currentImage.image,
                            this._imageTileLoader,
                            new TileStore(),
                            renderer);
                    }),
                publishReplay(1),
                refCount());

        subs.push(textureProvider$.subscribe(() => { /*noop*/ }));

        subs.push(textureProvider$.pipe(
            map(
                (provider: TextureProvider): GLRendererOperation => {
                    return (renderer: SliderGLRenderer): SliderGLRenderer => {
                        renderer.setTextureProvider(provider.id, provider);

                        return renderer;
                    };
                }))
            .subscribe(this._glRendererOperation$));

        subs.push(textureProvider$.pipe(
            pairwise())
            .subscribe(
                (pair: [TextureProvider, TextureProvider]): void => {
                    let previous: TextureProvider = pair[0];
                    previous.abort();
                }));

        const roiTrigger$ =
            this._container.configurationService.imageTiling$.pipe(
                switchMap(
                    (active): Observable<[RenderCamera, ViewportSize]> => {
                        return active ?
                            observableCombineLatest(
                                this._container.renderService.renderCameraFrame$,
                                this._container.renderService.size$.pipe(debounceTime(250))) :
                            new Subject();
                    }),
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

        subs.push(textureProvider$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<[TileRegionOfInterest, TextureProvider]> => {
                    return roiTrigger$.pipe(
                        map(
                            ([camera, size, transform]: [RenderCamera, ViewportSize, Transform]):
                                [TileRegionOfInterest, TextureProvider] => {
                                return [
                                    this._roiCalculator.computeRegionOfInterest(camera, size, transform),
                                    provider,
                                ];
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
                }));

        const hasTexture$ = textureProvider$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<boolean> => {
                    return provider.hasTexture$;
                }),
            startWith(false),
            publishReplay(1),
            refCount());

        subs.push(hasTexture$.subscribe(() => { /*noop*/ }));

        const textureProviderPrev$ =
            this._container.configurationService.imageTiling$.pipe(
                switchMap(
                    (active): Observable<AnimationFrame> => {
                        return active ?
                            this._navigator.stateService.currentState$ :
                            new Subject();
                    }),
                filter(
                    (frame: AnimationFrame): boolean => {
                        return !!frame.state.previousImage;
                    }),
                distinctUntilChanged(
                    undefined,
                    (frame: AnimationFrame): string => {
                        return frame.state.previousImage.id;
                    }),
                withLatestFrom(
                    this._container.glRenderer.webGLRenderer$,
                    this._container.renderService.size$),
                map(
                    ([frame, renderer, size]: [AnimationFrame, THREE.WebGLRenderer, ViewportSize]): TextureProvider => {
                        const state = frame.state;
                        const previousImage = state.previousImage;
                        const previousTransform = state.previousTransform;

                        return new TextureProvider(
                            previousImage.id,
                            previousTransform.basicWidth,
                            previousTransform.basicHeight,
                            previousImage.image,
                            this._imageTileLoader,
                            new TileStore(),
                            renderer);
                    }),
                publishReplay(1),
                refCount());

        subs.push(textureProviderPrev$.subscribe(() => { /*noop*/ }));

        subs.push(textureProviderPrev$.pipe(
            map(
                (provider: TextureProvider): GLRendererOperation => {
                    return (renderer: SliderGLRenderer): SliderGLRenderer => {
                        renderer.setTextureProviderPrev(provider.id, provider);

                        return renderer;
                    };
                }))
            .subscribe(this._glRendererOperation$));

        subs.push(textureProviderPrev$.pipe(
            pairwise())
            .subscribe(
                (pair: [TextureProvider, TextureProvider]): void => {
                    let previous: TextureProvider = pair[0];
                    previous.abort();
                }));

        const roiTriggerPrev$ =
            this._container.configurationService.imageTiling$.pipe(
                switchMap(
                    (active): Observable<[RenderCamera, ViewportSize]> => {
                        return active ?
                            observableCombineLatest(
                                this._container.renderService.renderCameraFrame$,
                                this._container.renderService.size$.pipe(debounceTime(250))) :
                            new Subject();
                    }),
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

        subs.push(textureProviderPrev$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<[TileRegionOfInterest, TextureProvider]> => {
                    return roiTriggerPrev$.pipe(
                        map(
                            ([camera, size, transform]: [RenderCamera, ViewportSize, Transform]):
                                [TileRegionOfInterest, TextureProvider] => {
                                return [
                                    this._roiCalculator.computeRegionOfInterest(camera, size, transform),
                                    provider,
                                ];
                            }));
                }),
            filter(
                (args: [TileRegionOfInterest, TextureProvider]): boolean => {
                    return !args[1].disposed;
                }),
            withLatestFrom(this._navigator.stateService.currentState$))
            .subscribe(
                ([[roi, provider], frame]: [[TileRegionOfInterest, TextureProvider], AnimationFrame]): void => {
                    let shiftedRoi: TileRegionOfInterest = null;

                    if (isSpherical(frame.state.previousImage.cameraType)) {
                        if (isSpherical(frame.state.currentImage.cameraType)) {
                            const currentViewingDirection: THREE.Vector3 =
                                this._spatial.viewingDirection(frame.state.currentImage.rotation);
                            const previousViewingDirection: THREE.Vector3 =
                                this._spatial.viewingDirection(frame.state.previousImage.rotation);

                            const directionDiff: number = this._spatial.angleBetweenVector2(
                                currentViewingDirection.x,
                                currentViewingDirection.y,
                                previousViewingDirection.x,
                                previousViewingDirection.y);

                            const shift: number = directionDiff / (2 * Math.PI);

                            const bbox: TileBoundingBox = {
                                maxX: this._spatial.wrap(roi.bbox.maxX + shift, 0, 1),
                                maxY: roi.bbox.maxY,
                                minX: this._spatial.wrap(roi.bbox.minX + shift, 0, 1),
                                minY: roi.bbox.minY,
                            };

                            shiftedRoi = {
                                bbox: bbox,
                                pixelHeight: roi.pixelHeight,
                                pixelWidth: roi.pixelWidth,
                            };
                        } else {
                            const currentViewingDirection: THREE.Vector3 =
                                this._spatial.viewingDirection(frame.state.currentImage.rotation);
                            const previousViewingDirection: THREE.Vector3 =
                                this._spatial.viewingDirection(frame.state.previousImage.rotation);

                            const directionDiff: number = this._spatial.angleBetweenVector2(
                                currentViewingDirection.x,
                                currentViewingDirection.y,
                                previousViewingDirection.x,
                                previousViewingDirection.y);

                            const shiftX: number = directionDiff / (2 * Math.PI);

                            const a1: number = this._spatial.angleToPlane(currentViewingDirection.toArray(), [0, 0, 1]);
                            const a2: number = this._spatial.angleToPlane(previousViewingDirection.toArray(), [0, 0, 1]);

                            const shiftY: number = (a2 - a1) / (2 * Math.PI);

                            const currentTransform: Transform = frame.state.currentTransform;
                            const size: number = Math.max(currentTransform.basicWidth, currentTransform.basicHeight);
                            const hFov: number = size > 0 ?
                                2 * Math.atan(0.5 * currentTransform.basicWidth / (size * currentTransform.focal)) :
                                Math.PI / 3;
                            const vFov: number = size > 0 ?
                                2 * Math.atan(0.5 * currentTransform.basicHeight / (size * currentTransform.focal)) :
                                Math.PI / 3;

                            const spanningWidth: number = hFov / (2 * Math.PI);
                            const spanningHeight: number = vFov / Math.PI;

                            const basicWidth: number = (roi.bbox.maxX - roi.bbox.minX) * spanningWidth;
                            const basicHeight: number = (roi.bbox.maxY - roi.bbox.minY) * spanningHeight;

                            const pixelWidth: number = roi.pixelWidth * spanningWidth;
                            const pixelHeight: number = roi.pixelHeight * spanningHeight;

                            const zoomShiftX: number = (roi.bbox.minX + roi.bbox.maxX) / 2 - 0.5;
                            const zoomShiftY: number = (roi.bbox.minY + roi.bbox.maxY) / 2 - 0.5;

                            const minX: number = 0.5 + shiftX + spanningWidth * zoomShiftX - basicWidth / 2;
                            const maxX: number = 0.5 + shiftX + spanningWidth * zoomShiftX + basicWidth / 2;
                            const minY: number = 0.5 + shiftY + spanningHeight * zoomShiftY - basicHeight / 2;
                            const maxY: number = 0.5 + shiftY + spanningHeight * zoomShiftY + basicHeight / 2;

                            const bbox: TileBoundingBox = {
                                maxX: this._spatial.wrap(maxX, 0, 1),
                                maxY: maxY,
                                minX: this._spatial.wrap(minX, 0, 1),
                                minY: minY,
                            };

                            shiftedRoi = {
                                bbox: bbox,
                                pixelHeight: pixelHeight,
                                pixelWidth: pixelWidth,
                            };
                        }
                    } else {
                        const currentBasicAspect: number = frame.state.currentTransform.basicAspect;
                        const previousBasicAspect: number = frame.state.previousTransform.basicAspect;

                        const [[cornerMinX, cornerMinY], [cornerMaxX, cornerMaxY]]: number[][] =
                            this._getBasicCorners(currentBasicAspect, previousBasicAspect);

                        const basicWidth: number = cornerMaxX - cornerMinX;
                        const basicHeight: number = cornerMaxY - cornerMinY;

                        const pixelWidth: number = roi.pixelWidth / basicWidth;
                        const pixelHeight: number = roi.pixelHeight / basicHeight;

                        const minX: number = (basicWidth - 1) / (2 * basicWidth) + roi.bbox.minX / basicWidth;
                        const maxX: number = (basicWidth - 1) / (2 * basicWidth) + roi.bbox.maxX / basicWidth;
                        const minY: number = (basicHeight - 1) / (2 * basicHeight) + roi.bbox.minY / basicHeight;
                        const maxY: number = (basicHeight - 1) / (2 * basicHeight) + roi.bbox.maxY / basicHeight;

                        const bbox: TileBoundingBox = {
                            maxX: maxX,
                            maxY: maxY,
                            minX: minX,
                            minY: minY,
                        };

                        this._clipBoundingBox(bbox);

                        shiftedRoi = {
                            bbox: bbox,
                            pixelHeight: pixelHeight,
                            pixelWidth: pixelWidth,
                        };
                    }

                    provider.setRegionOfInterest(shiftedRoi);
                }));

        const hasTexturePrev$ = textureProviderPrev$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<boolean> => {
                    return provider.hasTexture$;
                }),
            startWith(false),
            publishReplay(1),
            refCount());

        subs.push(hasTexturePrev$.subscribe(() => { /*noop*/ }));
    }

    protected _deactivate(): void {
        this._waitSubscription.unsubscribe();
        this._navigator.stateService.state$.pipe(
            first())
            .subscribe(
                (state: State): void => {
                    if (state !== State.Traversing) {
                        this._navigator.stateService.traverse();
                    }
                });

        this._glRendererDisposer$.next(null);
        this._domRenderer.deactivate();
        this._subscriptions.unsubscribe();

        this.configure({ ids: null });
    }

    protected _getDefaultConfiguration(): SliderConfiguration {
        return {
            initialPosition: 1,
            mode: SliderConfigurationMode.Motion,
            sliderVisible: true,
        };
    }

    private _catchCacheImage$(imageId: string): Observable<Image> {
        return this._navigator.graphService.cacheImage$(imageId).pipe(
            catchError(
                (error: Error): Observable<Image> => {
                    console.error(`Failed to cache slider image (${imageId})`, error);

                    return observableEmpty();
                }));
    }

    private _getBasicCorners(currentAspect: number, previousAspect: number): number[][] {
        let offsetX: number;
        let offsetY: number;

        if (currentAspect > previousAspect) {
            offsetX = 0.5;
            offsetY = 0.5 * currentAspect / previousAspect;
        } else {
            offsetX = 0.5 * previousAspect / currentAspect;
            offsetY = 0.5;
        }

        return [[0.5 - offsetX, 0.5 - offsetY], [0.5 + offsetX, 0.5 + offsetY]];
    }

    private _clipBoundingBox(bbox: TileBoundingBox): void {
        bbox.minX = Math.max(0, Math.min(1, bbox.minX));
        bbox.maxX = Math.max(0, Math.min(1, bbox.maxX));
        bbox.minY = Math.max(0, Math.min(1, bbox.minY));
        bbox.maxY = Math.max(0, Math.min(1, bbox.maxY));
    }
}
