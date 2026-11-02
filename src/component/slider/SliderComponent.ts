import * as THREE from "three";
import {
    combineLatest as observableCombineLatest,
    concat as observableConcat,
    merge as observableMerge,
    empty as observableEmpty,
    of as observableOf,
    timer as observableTimer,
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
    SliderCombination,
    GLRendererOperation,
    PositionLookat,
} from "./SliderInterfaces";
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
import { Transform } from "../../geo/Transform";
import { SliderDOMRenderer } from "./SliderDOMRenderer";
import { isSpherical } from "../../geo/Geo";
import { ComponentName } from "../ComponentName";
import { SliderGLRenderer } from "./SliderGLRenderer";
import { SliderAutomaticMotion, translatedSliderPerspective } from "./SliderAutomaticMotion";
import { sliderPairKey, sliderCameraOrigin, sliderViewAlignedStationary } from "./SliderReconstruction";
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
    private _position$: Subject<number> = new Subject<number>();
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
    /**
     * Set the curtain position without restarting the comparison renderer.
     *
     * @param {number} position Position on the interval [0, 1].
     * @throws {RangeError} If position is outside the interval or not finite.
     */
    public setPosition(position: number): void {
        if (!Number.isFinite(position) || position < 0 || position > 1) {
            throw new RangeError("Slider position must be finite and between 0 and 1");
        }
        this._position$.next(position);
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
            observableMerge(this._domRenderer.position$, this._position$));
        const safety = new SliderAutomaticMotion();
        subs.push(new Subscription(() => safety.dispose()));
        // Snapshot only changed views. Immediately revoke coverage, then check
        // after 100ms of stability: never raycast on each animation/drag frame.
        const coverageView$ = this.configuration$.pipe(
            map(c => c.automaticMotion === true && c.viewAligned === true),
            distinctUntilChanged(),
            switchMap(automatic => automatic ? observableCombineLatest(
                observableMerge(this._container.renderService.renderCamera$,
                    this._container.renderService.renderCameraFrame$),
                this._container.renderService.size$).pipe(
                    map(([render, size]: [RenderCamera, ViewportSize]) => ({
                        render, size,
                        key: render && render.perspective ?
                            [render.currentImageId, ...render.perspective.projectionMatrix.elements,
                                ...render.perspective.projectionMatrixInverse.elements,
                                ...render.perspective.quaternion.toArray(), ...render.perspective.up.toArray(),
                                ...render.perspective.matrixWorld.elements.slice(0, 12),
                                render.perspective.near, render.perspective.far, size.width, size.height].join(",") : "invalid",
                    })),
                    distinctUntilChanged((a, b) => a.key === b.key),
                    switchMap(({ render, size }) => {
                        if (!render || !render.perspective) { return observableOf(null); }
                        const view = { perspective: render.perspective.clone(), imageId: render.currentImageId,
                            size: { width: size.width, height: size.height } };
                        return observableConcat(observableOf(null), observableTimer(100).pipe(map(() => view)));
                    }),
                    startWith(null)) : observableOf(null)));
        // One decision (including its exact frame/config) is shared by DOM and
        // GL. In particular, a new ids selection can never enable the old pair.
        const decision$ = observableCombineLatest(
            this.configuration$,
            this._navigator.stateService.currentState$,
            coverageView$,
            this._container.renderService.size$.pipe(startWith(null))).pipe(
                map(([configuration, frame, view, size]) => {
                    const automatic = configuration.automaticMotion === true && configuration.viewAligned === true;
                    const stationaryOnly = sliderViewAlignedStationary(frame.state, configuration.viewAligned === true);
                    const currentView = view && size && view.size.width === size.width && view.size.height === size.height;
                    const eligible = automatic && !stationaryOnly && safety.resolve(
                        { ...configuration, mode: SliderConfigurationMode.Motion }, frame.state,
                        currentView ? view.perspective : null, size, view && view.imageId) === SliderConfigurationMode.Motion;
                    const mode = stationaryOnly ? SliderConfigurationMode.Stationary :
                        automatic ? eligible && configuration.mode === SliderConfigurationMode.Motion ?
                            SliderConfigurationMode.Motion : SliderConfigurationMode.Stationary : configuration.mode;
                    return { configuration, frame, mode, automatic, eligible, stationaryOnly };
                }),
                publishReplay(1),
                refCount());
        const viewAligned$ = this.configuration$.pipe(
            map(
                (configuration: SliderConfiguration): boolean =>
                    configuration.viewAligned === true),
            distinctUntilChanged());
        const screenSpace$ = this.configuration$.pipe(
            map((configuration: SliderConfiguration): boolean =>
                configuration.screenSpace === true),
            distinctUntilChanged());
        const interactionDecision$ = decision$.pipe(
            // AnimationFrame.state can be a shared mutable StateContext. Copy
            // primitives BEFORE distinct, never compare aliases to old frames.
            map(d => ({
                mode: d.mode, automatic: d.automatic, viewAligned: d.configuration.viewAligned === true, motionless: d.frame.state.motionless,
                paired: !!d.frame.state.currentImage && !!d.frame.state.previousImage,
                spherical: !!d.frame.state.currentImage && isSpherical(d.frame.state.currentImage.cameraType),
                key: JSON.stringify([d.mode, d.automatic, d.configuration.viewAligned === true, d.frame.state.motionless,
                    !!d.frame.state.currentImage, !!d.frame.state.previousImage,
                    d.frame.state.currentImage && d.frame.state.currentImage.id,
                    d.frame.state.previousImage && d.frame.state.previousImage.id,
                    d.frame.state.currentImage && d.frame.state.currentImage.cameraType,
                    d.frame.state.previousImage && d.frame.state.previousImage.cameraType]),
            })),
            distinctUntilChanged((a, b) => a.key === b.key));
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
            this._navigator.stateService.currentState$,
            viewAligned$).pipe(
                map(
                    ([sliderVisible, frame, viewAligned]:
                        [boolean, AnimationFrame, boolean]): boolean => {
                        return sliderVisible && !(frame.state.currentImage == null ||
                            frame.state.previousImage == null ||
                            (!viewAligned && isSpherical(
                                frame.state.currentImage.cameraType) &&
                                !isSpherical(frame.state.previousImage.cameraType)));
                    }),
                distinctUntilChanged());
        this._waitSubscription = observableCombineLatest(
            interactionDecision$,
            sliderVisible$,
            this._navigator.stateService.state$)
            .subscribe(
                ([decision, sliderVisible, state]): void => {
                    // Waiting resets zoom and the selected direction. View-aligned
                    // comparisons MUST stay interactive even in effective Motion;
                    // only the GL clone translates, never the native source view.
                    if (!sliderVisible || !decision.paired) { return; }
                    const interactive = decision.viewAligned || decision.automatic || decision.motionless ||
                        decision.mode === SliderConfigurationMode.Stationary || decision.spherical;
                    if (interactive && state !== State.WaitingInteractively) {
                        this._navigator.stateService.waitInteractively();
                    } else if (!interactive && state !== State.Waiting) {
                        this._navigator.stateService.wait();
                    }
                });
        subs.push(observableCombineLatest(position$, interactionDecision$, sliderVisible$)
            .subscribe(([position, decision]): void => {
                if (decision.viewAligned || decision.automatic || decision.motionless ||
                    decision.mode === SliderConfigurationMode.Stationary || decision.spherical) {
                    this._navigator.stateService.moveTo(1);
                } else {
                    this._navigator.stateService.moveTo(position);
                }
            }));
        subs.push(observableCombineLatest(
            position$, decision$, sliderVisible$, this._container.renderService.size$).pipe(
                map(([position, decision, sliderVisible]): VirtualNodeHash => ({
                    name: this._name,
                    vNode: this._domRenderer.render(position, decision.mode,
                        decision.frame.state.motionless || decision.stationaryOnly || decision.automatic && !decision.eligible,
                        !!decision.frame.state.currentImage && isSpherical(decision.frame.state.currentImage.cameraType),
                        sliderVisible),
                })))
            .subscribe(this._container.domRenderer.render$));
        this._glRendererCreator$.next(null);
        subs.push(observableCombineLatest(
            position$,
            spherical$,
            sliderVisible$,
            this._container.renderService.renderCamera$,
            this._navigator.stateService.currentTransform$,
            screenSpace$).pipe(
                map(
                    ([position, spherical, visible, render, transform, screenSpace]:
                        [number, boolean, boolean, RenderCamera, Transform, boolean]): [number, boolean] => {
                        if (screenSpace) {
                            return [visible ? position : 1, true];
                        }
                        if (!spherical) {
                            return [visible ? position : 1, false];
                        }
                        const basicMin: number[] = this._viewportCoords.viewportToBasic(-1.15, 0, transform, render.perspective);
                        const basicMax: number[] = this._viewportCoords.viewportToBasic(1.15, 0, transform, render.perspective);
                        const shiftedMax: number = basicMax[0] < basicMin[0] ? basicMax[0] + 1 : basicMax[0];
                        const basicPosition: number = basicMin[0] + position * (shiftedMax - basicMin[0]);
                        return [basicPosition > 1 ? basicPosition - 1 : basicPosition, false];
                    }),
                map(
                    ([position, screenSpace]: [number, boolean]): GLRendererOperation => {
                        return (glRenderer: SliderGLRenderer): SliderGLRenderer => {
                            glRenderer.updateCurtain(position, screenSpace);
                            return glRenderer;
                        };
                    }))
            .subscribe(this._glRendererOperation$));
        subs.push(this._configuration$.pipe(
            map((configuration: SliderConfiguration): number[] => configuration.viewCorrection ?? null),
            distinctUntilChanged((a: number[], b: number[]): boolean => JSON.stringify(a) === JSON.stringify(b)),
            map((correction: number[]): GLRendererOperation => (glRenderer): SliderGLRenderer => {
                glRenderer.updateViewCorrection(correction);
                return glRenderer;
            }))
            .subscribe(this._glRendererOperation$));
        subs.push(this._configuration$.pipe(
            map((configuration: SliderConfiguration): number => configuration.viewScale ?? 1),
            distinctUntilChanged(),
            map((scale: number): GLRendererOperation => (glRenderer): SliderGLRenderer => {
                glRenderer.updateViewScale(scale);
                return glRenderer;
            }))
            .subscribe(this._glRendererOperation$));
        subs.push(decision$.pipe(
            map((decision): GLRendererOperation => (glRenderer): SliderGLRenderer => {
                const c = decision.configuration;
                glRenderer.updateCurtainFeather(c.curtainFeather);
                if (decision.automatic) {
                    glRenderer.update(decision.frame, decision.mode,
                        c.gravityAligned === true, c.viewAligned === true, true);
                } else {
                    glRenderer.update(decision.frame, decision.mode,
                        c.gravityAligned === true, c.viewAligned === true);
                }
                return glRenderer;
            }))
            .subscribe(this._glRendererOperation$));
        subs.push(this._configuration$.pipe(
            filter(
                (configuration: SliderConfiguration): boolean => {
                    return configuration.ids != null;
                }),
            switchMap(
                (configuration: SliderConfiguration): Observable<SliderCombination & { viewAligned: boolean }> => {
                    return observableZip(
                        this._catchCacheImage$(configuration.ids.background),
                        this._catchCacheImage$(configuration.ids.foreground)).pipe(
                            // Read the live source view after hydration, so wheel
                            // zoom while the new background loads is not undone.
                            switchMap((images: [Image, Image]) =>
                                this._navigator.stateService.currentState$.pipe(
                                    first(),
                                    map((frame: AnimationFrame): SliderCombination & { viewAligned: boolean } => ({
                                        images: { background: images[0], foreground: images[1] },
                                        state: frame.state,
                                        viewAligned: configuration.viewAligned === true,
                                    })))));
                }))
            .subscribe(
                (co: SliderCombination & { viewAligned: boolean }): void => {
                    if (co.state.currentImage != null &&
                        co.state.previousImage != null &&
                        co.state.currentImage.id === co.images.foreground.id &&
                        co.state.previousImage.id === co.images.background.id) {
                        return;
                    }
                    const center = co.viewAligned && co.state.currentImage.id === co.images.foreground.id ?
                        co.state.currentTransform.projectBasic(co.state.camera.lookat.toArray()) : null;
                    if (co.state.currentImage.id === co.images.background.id) {
                        this._navigator.stateService.setImages([co.images.foreground]);
                    } else if (co.state.currentImage.id === co.images.foreground.id &&
                        co.state.trajectory.length === 1) {
                        this._navigator.stateService.prependImages([co.images.background]);
                    } else {
                        this._navigator.stateService.setImages([co.images.background]);
                        this._navigator.stateService.setImages([co.images.foreground]);
                    }
                    // Replacing a regular-photo trajectory recreates its native
                    // cameras. Retain the source's live center (including wheel
                    // zoom's anchor) instead of snapping back to the optical axis.
                    // Zoom is already retained by state; never overwrite it here.
                    if (center != null) {
                        this._navigator.stateService.setCenter(center);
                    }
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
                filter(frame => !!frame.state.currentImage && !!frame.state.currentTransform),
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
        const viewAlignedRoiTrigger$ = observableCombineLatest(
            decision$, position$, this._container.renderService.renderCameraFrame$, this._container.renderService.size$).pipe(
                map(([d, position, camera, size]) => ({
                    viewAligned: d.configuration.viewAligned === true, mode: d.mode,
                    camera, size, transform: d.frame.state.currentTransform,
                    key: [d.configuration.viewAligned === true, d.mode,
                        d.configuration.viewAligned === true ? sliderPairKey(d.frame.state) : "legacy",
                        d.frame.state.currentImage && d.frame.state.currentImage.id,
                        d.frame.state.previousImage && d.frame.state.previousImage.id, position,
                        ...camera.perspective.projectionMatrix.elements, ...camera.perspective.matrixWorld.elements.slice(0, 12),
                        size.width, size.height].join(","),
                })),
                distinctUntilChanged((a, b) => a.key === b.key),
                filter(d => d.viewAligned),
                map(({ camera, size, transform }): [RenderCamera, ViewportSize, Transform] => [camera, size, transform]));
        subs.push(textureProvider$.pipe(
            switchMap(
                (provider: TextureProvider): Observable<[TileRegionOfInterest, TextureProvider]> => {
                    return observableMerge(roiTrigger$, viewAlignedRoiTrigger$).pipe(
                        withLatestFrom(decision$, position$),
                        filter(([_view, decision]) => !provider.disposed &&
                            (decision.configuration.viewAligned !== true ||
                                !!decision.frame.state.currentImage && !!decision.frame.state.previousImage &&
                                !!decision.frame.state.currentTransform && !!decision.frame.state.previousTransform)),
                        map(
                            ([[camera, size, transform], decision, position]):
                                [TileRegionOfInterest, TextureProvider] => {
                                return [
                                    decision.configuration.viewAligned === true && decision.mode === SliderConfigurationMode.Motion ?
                                        this._getMotionRegionOfInterest(camera, size, transform, decision.frame, position) :
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
                        return !!frame.state.previousImage && !!frame.state.previousTransform;
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
                    return observableMerge(roiTriggerPrev$, viewAlignedRoiTrigger$).pipe(
                        withLatestFrom(
                            decision$, position$),
                        filter(([_view, decision]) => !provider.disposed &&
                            (decision.configuration.viewAligned !== true ||
                                !!decision.frame.state.currentImage && !!decision.frame.state.previousImage &&
                                !!decision.frame.state.currentTransform && !!decision.frame.state.previousTransform)),
                        map(
                            ([[camera, size, transform], decision, position]):
                                [TileRegionOfInterest, TextureProvider] => {
                                const frame = decision.frame;
                                const viewAligned = decision.configuration.viewAligned === true;
                                return [
                                    decision.configuration.viewAligned === true && decision.mode === SliderConfigurationMode.Motion ?
                                        this._getMotionRegionOfInterest(camera, size, frame.state.previousTransform, frame, position) :
                                        viewAligned ? this._getViewAlignedRegionOfInterest(
                                            camera, size, frame.state.previousTransform) :
                                            this._roiCalculator.computeRegionOfInterest(camera, size, transform),
                                    provider,
                                ];
                            }));
                }),
            filter(
                (args: [TileRegionOfInterest, TextureProvider]): boolean => {
                    return !args[1].disposed;
                }),
            withLatestFrom(this._navigator.stateService.currentState$, viewAligned$))
            .subscribe(
                ([[roi, provider], frame, viewAligned]:
                    [[TileRegionOfInterest, TextureProvider], AnimationFrame, boolean]): void => {
                    if (viewAligned) {
                        provider.setRegionOfInterest(roi);
                        return;
                    }
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
            viewAligned: false,
            automaticMotion: false,
            automaticMotionPolicy: "strict",
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
    private _getMotionRegionOfInterest(
        camera: RenderCamera,
        size: ViewportSize,
        transform: Transform,
        frame: AnimationFrame,
        position: number): TileRegionOfInterest {
        const origins = [frame.state.previousTransform, frame.state.currentTransform].map(sliderCameraOrigin);
        const perspective = translatedSliderPerspective(camera.perspective, origins[0], origins[1], position);
        const roi = this._roiCalculator.computeRegionOfInterest({ perspective } as RenderCamera, size, transform);
        // The general ROI calculator projects at a fixed depth, not at actual
        // mesh hits. Use the full photo as a safe superset in view-aligned Motion;
        // the provider still selects its bounded tile level from pixel size.
        return { ...roi, bbox: { minX: 0, maxX: 1, minY: 0, maxY: 1 } };
    }
    private _getViewAlignedRegionOfInterest(
        camera: RenderCamera,
        size: ViewportSize,
        transform: Transform): TileRegionOfInterest {
        // Project the same live rays through the background's own pose/lens.
        // Using its original origin is equivalent to a recentered panorama.
        const perspective = camera.perspective.clone();
        perspective.position.copy(sliderCameraOrigin(transform));
        perspective.updateMatrix();
        perspective.updateMatrixWorld(false);
        return this._roiCalculator.computeRegionOfInterest(
            { perspective } as RenderCamera, size, transform);
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
