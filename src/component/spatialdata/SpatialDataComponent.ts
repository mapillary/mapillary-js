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
    tap,
    withLatestFrom,
    filter,
} from "rxjs/operators";

import { Image } from "../../graph/Image";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ClusterReconstructionContract }
    from "../../api/contracts/ClusterReconstructionContract";
import { LatLonAlt } from "../../api/interfaces/LatLonAlt";
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
import { SpatialDataConfiguration }
    from "../interfaces/SpatialDataConfiguration";
import { CameraVisualizationMode } from "./CameraVisualizationMode";
import { OriginalPositionMode } from "./OriginalPositionMode";
import { SpatialDataScene } from "./SpatialDataScene";
import { SpatialDataCache } from "./SpatialDataCache";
import { CameraType } from "../../geo/interfaces/CameraType";
import { geodeticToEnu } from "../../geo/GeoCoords";
import { LatLon } from "../../api/interfaces/LatLon";

type IntersectEvent = MouseEvent | FocusEvent;

type Cell = {
    id: string;
    images: Image[];
}

type AdjancentParams = [boolean, boolean, number, Image];

export class SpatialDataComponent extends Component<SpatialDataConfiguration> {
    public static componentName: string = "spatialData";

    private _cache: SpatialDataCache;
    private _scene: SpatialDataScene;
    private _viewportCoords: ViewportCoords;
    private _spatial: Spatial;

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._cache = new SpatialDataCache(
            navigator.graphService,
            navigator.api.data);
        this._scene = new SpatialDataScene(this._getDefaultConfiguration());
        this._viewportCoords = new ViewportCoords();
        this._spatial = new Spatial();
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        subs.push(this._navigator.stateService.reference$
            .subscribe((): void => { this._scene.uncache(); }));

        subs.push(this._configuration$.pipe(
            map(
                (configuration: SpatialDataConfiguration): boolean => {
                    return configuration.earthControls;
                }),
            distinctUntilChanged(),
            withLatestFrom(this._navigator.stateService.state$))
            .subscribe(
                ([earth, state]: [boolean, State]): void => {
                    if (earth && state !== State.Earth) {
                        this._navigator.stateService.earth();
                    } else if (!earth && state === State.Earth) {
                        this._navigator.stateService.traverse();
                    }
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
                            .latLonToCellId(image.latLon);
                    }),
                distinctUntilChanged(),
                publishReplay(1),
                refCount());

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
            this._navigator.stateService.currentImage$)
            .pipe(
                distinctUntilChanged((
                    [e1, s1, d1, n1]: AdjancentParams,
                    [e2, s2, d2, n2]: AdjancentParams)
                    : boolean => {
                    if (e1 !== e2) { return false; }
                    if (e1) { return n1.id === n2.id && s1 === s2; }
                    return n1.id === n2.id && s1 === s2 && d1 === d2;
                }),
                concatMap(
                    ([earth, sequencePlay, bearing, image]
                        : AdjancentParams)
                        : Observable<string[]> => {
                        if (earth) {
                            const cellId = this._navigator.api.data.geometry
                                .latLonToCellId(image.latLon);
                            const cells = sequencePlay ?
                                [cellId] :
                                this._adjacentComponent(cellId, 1)
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

        const tile$: Observable<Cell> = cellIds$.pipe(
            switchMap(
                (cellIds: string[]): Observable<Cell> => {
                    return observableFrom(cellIds).pipe(
                        mergeMap(
                            (cellId: string): Observable<Cell> => {
                                const t$ = this._cache.hasTile(cellId) ?
                                    observableOf(this._cache.getTile(cellId)) :
                                    this._cache.cacheTile$(cellId);

                                return t$.pipe(
                                    map((images: Image[]) => ({ id: cellId, images })));
                            },
                            6));
                }),
            publish(),
            refCount());

        subs.push(tile$.pipe(
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([cell, reference]: [Cell, LatLonAlt]): void => {
                    if (this._scene.hasTile(cell.id)) {
                        return;
                    }

                    this._scene.addTile(
                        this._computeTileBBox(cell.id, reference),
                        cell.id);
                }));

        subs.push(tile$.pipe(
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([cell, reference]: [Cell, LatLonAlt]): void => {
                    this._addSceneImages(cell, reference);
                }));

        subs.push(tile$.pipe(
            concatMap(
                (cell: Cell): Observable<[string, ClusterReconstructionContract]> => {
                    const cellId = cell.id;
                    let reconstructions$: Observable<ClusterReconstructionContract>;
                    if (this._cache.hasClusterReconstructions(cellId)) {
                        reconstructions$ = observableFrom(this._cache.getClusterReconstructions(cellId));
                    } else if (this._cache.isCachingClusterReconstructions(cellId)) {
                        reconstructions$ = this._cache.cacheClusterReconstructions$(cellId).pipe(
                            last(null, {}),
                            switchMap(
                                (): Observable<ClusterReconstructionContract> => {
                                    return observableFrom(this._cache.getClusterReconstructions(cellId));
                                }));
                    } else if (this._cache.hasTile(cellId)) {
                        reconstructions$ = this._cache.cacheClusterReconstructions$(cellId);
                    } else {
                        reconstructions$ = observableEmpty();
                    }

                    return observableCombineLatest(observableOf(cellId), reconstructions$);
                }),
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([[cellId, reconstruction], reference]: [[string, ClusterReconstructionContract], LatLonAlt]): void => {
                    if (this._scene
                        .hasClusterReconstruction(
                            reconstruction.id,
                            cellId)) {
                        return;
                    }

                    this._scene.addClusterReconstruction(
                        reconstruction,
                        this._computeTranslation(
                            reconstruction,
                            reference),
                        cellId);
                }));

        subs.push(this._configuration$.pipe(
            map(
                (c: SpatialDataConfiguration): SpatialDataConfiguration => {
                    c.cameraSize = this._spatial.clamp(c.cameraSize, 0.01, 1);
                    c.pointSize = this._spatial.clamp(c.pointSize, 0.01, 1);
                    return {
                        cameraSize: c.cameraSize,
                        cameraVisualizationMode: c.cameraVisualizationMode,
                        camerasVisible: c.camerasVisible,
                        originalPositionMode: c.originalPositionMode,
                        pointSize: c.pointSize,
                        pointsVisible: c.pointsVisible,
                        tilesVisible: c.tilesVisible,
                    }
                }),
            distinctUntilChanged(
                (c1: SpatialDataConfiguration, c2: SpatialDataConfiguration): boolean => {
                    return c1.cameraSize === c2.cameraSize &&
                        c1.cameraVisualizationMode === c2.cameraVisualizationMode &&
                        c1.camerasVisible === c2.camerasVisible &&
                        c1.originalPositionMode === c2.originalPositionMode &&
                        c1.pointSize === c2.pointSize &&
                        c1.pointsVisible === c2.pointsVisible &&
                        c1.tilesVisible === c2.tilesVisible;
                }))
            .subscribe(
                (c: SpatialDataConfiguration): void => {
                    this._scene.setCameraSize(c.cameraSize);
                    this._scene.setCameraVisibility(c.camerasVisible);
                    this._scene.setPointSize(c.pointSize);
                    this._scene.setPointVisibility(c.pointsVisible);
                    this._scene.setTileVisibility(c.tilesVisible);
                    const cvm = c.cameraVisualizationMode;
                    this._scene.setCameraVisualizationMode(cvm);
                    const opm = c.originalPositionMode;
                    this._scene.setPositionMode(opm);
                }));

        subs.push(cellId$
            .subscribe(
                (cellId: string): void => {
                    const keepCells = this._adjacentComponent(cellId, 1);
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

        const intersectChange$ = this._configuration$.pipe(
            map(
                (c: SpatialDataConfiguration): SpatialDataConfiguration => {
                    c.cameraSize = this._spatial.clamp(c.cameraSize, 0.01, 1);
                    return {
                        cameraSize: c.cameraSize,
                        camerasVisible: c.camerasVisible,
                        earthControls: c.earthControls,
                    }
                }),
            distinctUntilChanged(
                (c1: SpatialDataConfiguration, c2: SpatialDataConfiguration): boolean => {
                    return c1.cameraSize === c2.cameraSize &&
                        c1.camerasVisible === c2.camerasVisible &&
                        c1.earthControls === c2.earthControls;
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
                        : Observable<[IntersectEvent, RenderCamera, SpatialDataConfiguration]> => {
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
                                observableOf({}));
                    }))
            .subscribe(
                ([event, render]
                    : [IntersectEvent, RenderCamera, SpatialDataConfiguration]): void => {
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
                        return this._cache.hasTile(cellId);
                    }),
                mergeMap(
                    (cellId: string): Observable<[Cell, LatLonAlt]> => {
                        return this._cache.updateCell$(cellId).pipe(
                            map((images: Image[]) => ({ id: cellId, images })),
                            withLatestFrom(
                                this._navigator.stateService.reference$
                            )
                        );
                    }),
                publish<[Cell, LatLonAlt]>(),
                refCount())

        subs.push(updatedCell$
            .subscribe(
                ([cell, reference]: [Cell, LatLonAlt]): void => {
                    this._addSceneImages(cell, reference);
                }));

        subs.push(updatedCell$
            .pipe(
                concatMap(
                    ([cell]: [Cell, LatLonAlt]): Observable<[string, ClusterReconstructionContract]> => {
                        const cellId = cell.id;
                        const cache = this._cache;
                        let reconstructions$: Observable<ClusterReconstructionContract>;
                        if (cache.hasClusterReconstructions(cellId)) {
                            reconstructions$ =
                                cache.updateClusterReconstructions$(cellId);
                        } else if (cache.isCachingClusterReconstructions(cellId)) {
                            reconstructions$ = this._cache.cacheClusterReconstructions$(cellId).pipe(
                                last(null, {}),
                                switchMap(
                                    (): Observable<ClusterReconstructionContract> => {
                                        return observableFrom(
                                            cache.updateClusterReconstructions$(cellId));
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
                ([[cellId, reconstruction], reference]: [[string, ClusterReconstructionContract], LatLonAlt]): void => {
                    if (this._scene.hasClusterReconstruction(reconstruction.id, cellId)) {
                        return;
                    }

                    this._scene.addClusterReconstruction(
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

    protected _getDefaultConfiguration(): SpatialDataConfiguration {
        return {
            cameraSize: 0.1,
            cameraVisualizationMode: CameraVisualizationMode.Default,
            camerasVisible: false,
            originalPositionMode: OriginalPositionMode.Hidden,
            pointSize: 0.1,
            pointsVisible: true,
            tilesVisible: false,
        };
    }

    private _addSceneImages(cell: Cell, reference: LatLonAlt): void {
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

        if (currentDepth === maxDepth) { return; }

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
        const cell = geometry.latLonToCellId(image.latLon);
        const cells = [cell];
        const threshold = fov / 2;
        const adjacent = geometry.getAdjacent(cell);
        for (const a of adjacent) {
            const vertices = geometry.getVertices(a);
            for (const vertex of vertices) {
                const [x, y] =
                    geodeticToEnu(
                        vertex.lat,
                        vertex.lon,
                        0,
                        image.latLon.lat,
                        image.latLon.lon,
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

    private _computeOriginalPosition(image: Image, reference: LatLonAlt): number[] {
        return geodeticToEnu(
            image.originalLatLon.lat,
            image.originalLatLon.lon,
            image.originalAltitude != null ? image.originalAltitude : image.computedAltitude,
            reference.lat,
            reference.lon,
            reference.alt);
    }

    private _computeTileBBox(cellId: string, reference: LatLonAlt): number[][] {
        const vertices =
            this._navigator.api.data.geometry
                .getVertices(cellId)
                .map(
                    (vertex: LatLon): number[] => {
                        return geodeticToEnu(
                            vertex.lat,
                            vertex.lon,
                            0,
                            reference.lat,
                            reference.lon,
                            reference.alt);
                    });

        return vertices;
    }

    private _computeTranslation(
        reconstruction: ClusterReconstructionContract,
        reference: LatLonAlt)
        : number[] {
        return geodeticToEnu(
            reconstruction.reference.lat,
            reconstruction.reference.lon,
            reconstruction.reference.alt,
            reference.lat,
            reference.lon,
            reference.alt);
    }

    private _createTransform(image: Image, reference: LatLonAlt): Transform {
        const translation: number[] = Geo.computeTranslation(
            { alt: image.computedAltitude, lat: image.latLon.lat, lon: image.latLon.lon },
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
