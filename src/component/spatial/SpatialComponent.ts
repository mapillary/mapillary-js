import {
    combineLatest as observableCombineLatest,
    concat as observableConcat,
    empty as observableEmpty,
    from as observableFrom,
    merge as observableMerge,
    of as observableOf,
    Observable,
} from "rxjs";

import {
    catchError,
    concatMap,
    distinctUntilChanged,
    first,
    last,
    map,
    mergeMap,
    publishReplay,
    publish,
    refCount,
    switchMap,
    take,
    withLatestFrom,
    filter,
} from "rxjs/operators";

import { Image } from "../../graph/Image";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ClusterContract }
    from "../../api/contracts/ClusterContract";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { Spatial } from "../../geo/Spatial";
import { Transform } from "../../geo/Transform";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { FilterFunction } from "../../graph/FilterCreator";
import * as Geo from "../../geo/Geo";
import { RenderPass } from "../../render/RenderPass";
import { GLRenderHash } from "../../render/interfaces/IGLRenderHash";
import { RenderCamera } from "../../render/RenderCamera";
import { AnimationFrame } from "../../state/interfaces/AnimationFrame";
import { State } from "../../state/State";
import { PlayService } from "../../viewer/PlayService";
import { Component } from "../Component";
import { SpatialConfiguration }
    from "../interfaces/SpatialConfiguration";
import { CameraVisualizationMode } from "./enums/CameraVisualizationMode";
import { OriginalPositionMode } from "./enums/OriginalPositionMode";
import { isModeVisible, SpatialScene } from "./SpatialScene";
import { SpatialCache } from "./SpatialCache";
import { CameraType } from "../../geo/interfaces/CameraType";
import { geodeticToEnu } from "../../geo/GeoCoords";
import { LngLat } from "../../api/interfaces/LngLat";
import { ComponentName } from "../ComponentName";

type IntersectEvent = MouseEvent | FocusEvent;

type Cell = {
    id: string;
    images: Image[];
}

type AdjancentParams = [boolean, boolean, number, number, Image];

interface IntersectConfiguration {
    size: number;
    visible: boolean;
    earth: boolean;
}

export class SpatialComponent extends Component<SpatialConfiguration> {
    public static componentName: ComponentName = "spatial";

    private _cache: SpatialCache;
    private _scene: SpatialScene;
    private _viewportCoords: ViewportCoords;
    private _spatial: Spatial;

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._cache = new SpatialCache(
            navigator.graphService,
            navigator.api.data);
        this._scene = new SpatialScene(this._getDefaultConfiguration());
        this._viewportCoords = new ViewportCoords();
        this._spatial = new Spatial();
    }

    /**
     * Returns the image id of the camera frame closest to the current
     * render camera position at the specified point.
     *
     * @description Notice that the pixelPoint argument requires x, y
     * coordinates from pixel space.
     *
     * With this function, you can use the coordinates provided by mouse
     * events to get information out of the spatial component.
     *
     * If no camera frame exist at the pixel
     * point, `null` will be returned.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates on
     * the viewer element.
     * @returns {string} Image id of the camera frame closest to
     * the camera. If no camera frame is intersected at the
     * pixel point, `null` will be returned.
     *
     * @example
     * ```js
     * spatialComponent.getFrameIdAt([100, 125])
     *     .then((markerId) => { console.log(markerId); });
     * ```
     */
    public getFrameIdAt(pixelPoint: number[]): Promise<string> {
        return new Promise<string>((resolve: (value: string) => void, reject: (reason: Error) => void): void => {
            this._container.renderService.renderCamera$.pipe(
                first(),
                map(
                    (render: RenderCamera): string => {
                        const viewport = this._viewportCoords
                            .canvasToViewport(
                                pixelPoint[0],
                                pixelPoint[1],
                                this._container.container);

                        const id = this._scene.intersection
                            .intersectObjects(viewport, render.perspective);
                        return id;
                    }))
                .subscribe(
                    (id: string): void => {
                        resolve(id);
                    },
                    (error: Error): void => {
                        reject(error);
                    });
        });
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        subs.push(this._navigator.stateService.reference$
            .subscribe((): void => {
                this._scene.uncache();
            }));

        subs.push(this._navigator.graphService.filter$
            .subscribe(imageFilter => { this._scene.setFilter(imageFilter); }));

        const bearing$ = this._container.renderService.bearing$.pipe(
            map(
                (bearing: number): number => {
                    const interval = 6;
                    const discrete = interval * Math.floor(bearing / interval);
                    return discrete;
                }),
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        const cellId$ = this._navigator.stateService.currentImage$
            .pipe(
                map(
                    (image: Image): string => {
                        return this._navigator.api.data.geometry
                            .lngLatToCellId(image.lngLat);
                    }),
                distinctUntilChanged(),
                publishReplay(1),
                refCount());

        const cellGridDepth$ = this._configuration$
            .pipe(
                map(
                    (c: SpatialConfiguration): number => {
                        return this._spatial.clamp(c.cellGridDepth, 1, 3);
                    }),
                distinctUntilChanged());

        const sequencePlay$: Observable<boolean> = observableCombineLatest(
            this._navigator.playService.playing$,
            this._navigator.playService.speed$).pipe(
                map(
                    ([playing, speed]: [boolean, number]): boolean => {
                        return playing && speed > PlayService.sequenceSpeed;
                    }),
                distinctUntilChanged(),
                publishReplay(1),
                refCount());

        const earth$ = this._navigator.stateService.state$.pipe(
            map(
                (state: State): boolean => {
                    return state === State.Earth;
                }),
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        subs.push(earth$.subscribe(
            (earth: boolean): void => {
                this._scene.setNavigationState(earth);
            }));

        const cellIds$ = observableCombineLatest(
            earth$,
            sequencePlay$,
            bearing$,
            cellGridDepth$,
            this._navigator.stateService.currentImage$)
            .pipe(
                distinctUntilChanged((
                    [e1, s1, b1, d1, i1]: AdjancentParams,
                    [e2, s2, b2, d2, i2]: AdjancentParams)
                    : boolean => {
                    if (e1 !== e2) {
                        return false;
                    }
                    const isd = i1.id === i2.id && s1 === s2 && d1 === d2
                    if (e1) {
                        return isd;
                    }
                    return isd && b1 === b2;
                }),
                concatMap(
                    ([earth, sequencePlay, bearing, depth, image]
                        : AdjancentParams)
                        : Observable<string[]> => {
                        if (earth) {
                            const cellId = this._navigator.api.data.geometry
                                .lngLatToCellId(image.lngLat);
                            const cells = sequencePlay ?
                                [cellId] :
                                this._adjacentComponent(cellId, depth)
                            return observableOf(cells);
                        }

                        const fov = sequencePlay ? 30 : 90;
                        return observableOf(
                            this._cellsInFov(
                                image,
                                bearing,
                                fov));
                    }),
                publish<string[]>(),
                refCount());

        const cell$: Observable<Cell> = cellIds$.pipe(
            switchMap(
                (cellIds: string[]): Observable<Cell> => {
                    return observableFrom(cellIds).pipe(
                        mergeMap(
                            (cellId: string): Observable<Cell> => {
                                const t$ = this._cache.hasCell(cellId) ?
                                    observableOf(this._cache.getCell(cellId)) :
                                    this._cache.cacheCell$(cellId);

                                return t$.pipe(
                                    map((images: Image[]) => ({ id: cellId, images })));
                            },
                            6));
                }),
            publish(),
            refCount());

        subs.push(cell$.pipe(
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([cell, reference]: [Cell, LngLatAlt]): void => {
                    if (this._scene.hasCell(cell.id)) {
                        return;
                    }

                    this._scene.addCell(
                        this._cellToTopocentric(cell.id, reference),
                        cell.id);
                }));

        subs.push(cell$.pipe(
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([cell, reference]: [Cell, LngLatAlt]): void => {
                    this._addSceneImages(cell, reference);
                }));

        subs.push(cell$.pipe(
            concatMap(
                (cell: Cell): Observable<[string, ClusterContract]> => {
                    const cellId = cell.id;
                    let reconstructions$: Observable<ClusterContract>;
                    if (this._cache.hasClusters(cellId)) {
                        reconstructions$ = observableFrom(this._cache.getClusters(cellId));
                    } else if (this._cache.isCachingClusters(cellId)) {
                        reconstructions$ = this._cache.cacheClusters$(cellId).pipe(
                            last(null, {}),
                            switchMap(
                                (): Observable<ClusterContract> => {
                                    return observableFrom(this._cache.getClusters(cellId));
                                }));
                    } else if (this._cache.hasCell(cellId)) {
                        reconstructions$ = this._cache.cacheClusters$(cellId);
                    } else {
                        reconstructions$ = observableEmpty();
                    }

                    return observableCombineLatest(observableOf(cellId), reconstructions$);
                }),
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([[cellId, reconstruction], reference]: [[string, ClusterContract], LngLatAlt]): void => {
                    if (this._scene
                        .hasCluster(
                            reconstruction.id,
                            cellId)) {
                        return;
                    }

                    this._scene.addCluster(
                        reconstruction,
                        this._computeTranslation(
                            reconstruction,
                            reference),
                        cellId);
                }));

        subs.push(this._configuration$.pipe(
            map(
                (c: SpatialConfiguration): SpatialConfiguration => {
                    c.cameraSize = this._spatial.clamp(c.cameraSize, 0.01, 1);
                    c.pointSize = this._spatial.clamp(c.pointSize, 0.01, 1);
                    return {
                        cameraSize: c.cameraSize,
                        cameraVisualizationMode: c.cameraVisualizationMode,
                        originalPositionMode: c.originalPositionMode,
                        pointSize: c.pointSize,
                        pointsVisible: c.pointsVisible,
                        cellsVisible: c.cellsVisible,
                    }
                }),
            distinctUntilChanged(
                (c1: SpatialConfiguration, c2: SpatialConfiguration): boolean => {
                    return c1.cameraSize === c2.cameraSize &&
                        c1.cameraVisualizationMode === c2.cameraVisualizationMode &&
                        c1.originalPositionMode === c2.originalPositionMode &&
                        c1.pointSize === c2.pointSize &&
                        c1.pointsVisible === c2.pointsVisible &&
                        c1.cellsVisible === c2.cellsVisible;
                }))
            .subscribe(
                (c: SpatialConfiguration): void => {
                    this._scene.setCameraSize(c.cameraSize);
                    this._scene.setPointSize(c.pointSize);
                    this._scene.setPointVisibility(c.pointsVisible);
                    this._scene.setCellVisibility(c.cellsVisible);
                    const cvm = c.cameraVisualizationMode;
                    this._scene.setCameraVisualizationMode(cvm);
                    const opm = c.originalPositionMode;
                    this._scene.setPositionMode(opm);
                }));

        subs.push(observableCombineLatest(cellId$, cellGridDepth$)
            .subscribe(
                ([cellId, depth]: [string, number]): void => {
                    const keepCells = this._adjacentComponent(cellId, depth);
                    this._scene.uncache(keepCells);
                    this._cache.uncache(keepCells);
                }));

        subs.push(this._navigator.playService.playing$.pipe(
            switchMap(
                (playing: boolean): Observable<MouseEvent> => {
                    return playing ?
                        observableEmpty() :
                        this._container.mouseService.dblClick$;
                }),
            withLatestFrom(this._container.renderService.renderCamera$),
            switchMap(
                ([event, render]: [MouseEvent, RenderCamera]): Observable<Image> => {
                    const element: HTMLElement = this._container.container;
                    const [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);
                    const viewport: number[] = this._viewportCoords.canvasToViewport(
                        canvasX,
                        canvasY,
                        element);

                    const id = this._scene.intersection
                        .intersectObjects(viewport, render.perspective);

                    return !!id ?
                        this._navigator.moveTo$(id).pipe(
                            catchError(
                                (): Observable<Image> => {
                                    return observableEmpty();
                                })) :
                        observableEmpty();
                }))
            .subscribe());

        const intersectChange$ = observableCombineLatest(
            this._configuration$,
            earth$).pipe(
                map(
                    ([c, earth]: [SpatialConfiguration, boolean]): IntersectConfiguration => {
                        c.cameraSize = this._spatial.clamp(c.cameraSize, 0.01, 1);
                        return {
                            size: c.cameraSize,
                            visible:
                                isModeVisible(c.cameraVisualizationMode),
                            earth,
                        }
                    }),
                distinctUntilChanged(
                    (c1: IntersectConfiguration, c2: IntersectConfiguration): boolean => {
                        return c1.size === c2.size &&
                            c1.visible === c2.visible &&
                            c1.earth === c2.earth;
                    }));

        const mouseMove$ = this._container.mouseService.mouseMove$.pipe(
            publishReplay(1),
            refCount());

        subs.push(mouseMove$.subscribe());

        const mouseHover$ = observableMerge(
            this._container.mouseService.mouseEnter$,
            this._container.mouseService.mouseLeave$,
            this._container.mouseService.windowBlur$);

        subs.push(observableCombineLatest(
            this._navigator.playService.playing$,
            mouseHover$,
            earth$,
            this._navigator.graphService.filter$).pipe(
                switchMap(
                    ([playing, mouseHover]:
                        [boolean, IntersectEvent, boolean, FilterFunction])
                        : Observable<[IntersectEvent, RenderCamera, IntersectConfiguration]> => {
                        return !playing && mouseHover.type === "mouseenter" ?
                            observableCombineLatest(
                                observableConcat(
                                    mouseMove$.pipe(take(1)),
                                    this._container.mouseService.mouseMove$),
                                this._container.renderService.renderCamera$,
                                intersectChange$) :
                            observableCombineLatest(
                                observableOf(mouseHover),
                                observableOf(null),
                                observableOf(null));
                    }))
            .subscribe(
                ([event, render]
                    : [IntersectEvent, RenderCamera, IntersectConfiguration]): void => {
                    if (event.type !== "mousemove") {
                        this._scene.setHoveredImage(null);
                        return;
                    }

                    const element = this._container.container;
                    const [canvasX, canvasY] = this._viewportCoords.canvasPosition(<MouseEvent>event, element);
                    const viewport = this._viewportCoords.canvasToViewport(
                        canvasX,
                        canvasY,
                        element);

                    const key = this._scene.intersection
                        .intersectObjects(viewport, render.perspective);

                    this._scene.setHoveredImage(key);
                }));

        subs.push(this._navigator.stateService.currentId$
            .subscribe(
                (id: string): void => {
                    this._scene.setSelectedImage(id);
                }));

        subs.push(this._navigator.stateService.currentState$
            .pipe(
                map((frame: AnimationFrame): GLRenderHash => {
                    const scene = this._scene;

                    return {
                        name: this._name,
                        renderer: {
                            frameId: frame.id,
                            needsRender: scene.needsRender,
                            render: scene.render.bind(scene),
                            pass: RenderPass.Opaque,
                        },
                    };
                }))
            .subscribe(this._container.glRenderer.render$));

        const updatedCell$ = this._navigator.graphService.dataAdded$
            .pipe(
                filter(
                    (cellId: string) => {
                        return this._cache.hasCell(cellId);
                    }),
                mergeMap(
                    (cellId: string): Observable<[Cell, LngLatAlt]> => {
                        return this._cache.updateCell$(cellId).pipe(
                            map((images: Image[]) => ({ id: cellId, images })),
                            withLatestFrom(
                                this._navigator.stateService.reference$
                            )
                        );
                    }),
                publish<[Cell, LngLatAlt]>(),
                refCount())

        subs.push(updatedCell$
            .subscribe(
                ([cell, reference]: [Cell, LngLatAlt]): void => {
                    this._addSceneImages(cell, reference);
                }));

        subs.push(updatedCell$
            .pipe(
                concatMap(
                    ([cell]: [Cell, LngLatAlt]): Observable<[string, ClusterContract]> => {
                        const cellId = cell.id;
                        const cache = this._cache;
                        let reconstructions$: Observable<ClusterContract>;
                        if (cache.hasClusters(cellId)) {
                            reconstructions$ =
                                cache.updateClusters$(cellId);
                        } else if (cache.isCachingClusters(cellId)) {
                            reconstructions$ = this._cache.cacheClusters$(cellId).pipe(
                                last(null, {}),
                                switchMap(
                                    (): Observable<ClusterContract> => {
                                        return observableFrom(
                                            cache.updateClusters$(cellId));
                                    }));
                        } else {
                            reconstructions$ = observableEmpty();
                        }

                        return observableCombineLatest(
                            observableOf(cellId),
                            reconstructions$);
                    }),
                withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([[cellId, reconstruction], reference]: [[string, ClusterContract], LngLatAlt]): void => {
                    if (this._scene.hasCluster(reconstruction.id, cellId)) {
                        return;
                    }

                    this._scene.addCluster(
                        reconstruction,
                        this._computeTranslation(reconstruction, reference),
                        cellId);
                }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
        this._cache.uncache();
        this._scene.uncache();
        this._navigator.stateService.state$.pipe(
            first())
            .subscribe(
                (state: State): void => {
                    if (state === State.Earth) {
                        this._navigator.stateService.traverse();
                    }
                });
    }

    protected _getDefaultConfiguration(): SpatialConfiguration {
        return {
            cameraSize: 0.1,
            cameraVisualizationMode: CameraVisualizationMode.Homogeneous,
            cellGridDepth: 1,
            originalPositionMode: OriginalPositionMode.Hidden,
            pointSize: 0.1,
            pointsVisible: true,
            cellsVisible: false,
        };
    }

    private _addSceneImages(cell: Cell, reference: LngLatAlt): void {
        const cellId = cell.id;
        const images = cell.images;
        for (const image of images) {
            if (this._scene.hasImage(image.id, cellId)) { continue; }

            this._scene.addImage(
                image,
                this._createTransform(image, reference),
                this._computeOriginalPosition(image, reference),
                cellId);
        }
    }

    private _adjacentComponent(cellId: string, depth: number): string[] {
        const cells = new Set<string>();
        cells.add(cellId);
        this._adjacentComponentRecursive(cells, [cellId], 0, depth);
        return Array.from(cells);
    }

    private _adjacentComponentRecursive(
        cells: Set<string>,
        current: string[],
        currentDepth: number,
        maxDepth: number)
        : void {

        if (currentDepth >= maxDepth) { return; }

        const adjacent: string[] = [];
        for (const cellId of current) {
            const aCells =
                this._navigator.api.data.geometry.getAdjacent(cellId);
            adjacent.push(...aCells);
        }

        const newCells: string[] = [];
        for (const a of adjacent) {
            if (cells.has(a)) { continue; }
            cells.add(a);
            newCells.push(a);
        }

        this._adjacentComponentRecursive(
            cells,
            newCells,
            currentDepth + 1,
            maxDepth);
    }

    private _cellsInFov(
        image: Image,
        bearing: number,
        fov: number)
        : string[] {
        const spatial = this._spatial;
        const geometry = this._navigator.api.data.geometry;
        const cell = geometry.lngLatToCellId(image.lngLat);
        const cells = [cell];
        const threshold = fov / 2;
        const adjacent = geometry.getAdjacent(cell);
        for (const a of adjacent) {
            const vertices = geometry.getVertices(a);
            for (const vertex of vertices) {
                const [x, y] =
                    geodeticToEnu(
                        vertex.lng,
                        vertex.lat,
                        0,
                        image.lngLat.lng,
                        image.lngLat.lat,
                        0);
                const azimuthal = Math.atan2(y, x);
                const vertexBearing = spatial.radToDeg(
                    spatial.azimuthalToBearing(azimuthal));

                if (Math.abs(vertexBearing - bearing) < threshold) {
                    cells.push(a);
                }
            }
        }
        return cells;
    }

    private _computeOriginalPosition(image: Image, reference: LngLatAlt): number[] {
        return geodeticToEnu(
            image.originalLngLat.lng,
            image.originalLngLat.lat,
            image.originalAltitude != null ? image.originalAltitude : image.computedAltitude,
            reference.lng,
            reference.lat,
            reference.alt);
    }

    private _cellToTopocentric(
        cellId: string,
        reference: LngLatAlt): number[][] {

        const vertices =
            this._navigator.api.data.geometry
                .getVertices(cellId)
                .map(
                    (vertex: LngLat): number[] => {
                        return geodeticToEnu(
                            vertex.lng,
                            vertex.lat,
                            0,
                            reference.lng,
                            reference.lat,
                            reference.alt);
                    });

        return vertices;
    }

    private _computeTranslation(
        reconstruction: ClusterContract,
        reference: LngLatAlt)
        : number[] {
        return geodeticToEnu(
            reconstruction.reference.lng,
            reconstruction.reference.lat,
            reconstruction.reference.alt,
            reference.lng,
            reference.lat,
            reference.alt);
    }

    private _createTransform(image: Image, reference: LngLatAlt): Transform {
        const translation: number[] = Geo.computeTranslation(
            { alt: image.computedAltitude, lat: image.lngLat.lat, lng: image.lngLat.lng },
            image.rotation,
            reference);

        const transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            translation,
            undefined,
            undefined,
            image.cameraParameters,
            <CameraType>image.cameraType);

        return transform;
    }
}
