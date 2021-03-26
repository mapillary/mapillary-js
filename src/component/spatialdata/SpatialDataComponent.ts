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

import { Node } from "../../graph/Node";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import {
    CellNeighbors,
} from "../../api/interfaces/CellCorners";
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
    nodes: Node[];
}

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
            .subscribe(nodeFilter => { this._scene.setFilter(nodeFilter); }));

        const direction$ = this._container.renderService.bearing$.pipe(
            map(
                (bearing: number): string => {
                    let direction: string = "";

                    if (bearing > 292.5 || bearing <= 67.5) {
                        direction += "n";
                    }

                    if (bearing > 112.5 && bearing <= 247.5) {
                        direction += "s";
                    }

                    if (bearing > 22.5 && bearing <= 157.5) {
                        direction += "e";
                    }

                    if (bearing > 202.5 && bearing <= 337.5) {
                        direction += "w";
                    }

                    return direction;
                }),
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        const hash$ = this._navigator.stateService.reference$.pipe(
            tap((): void => { this._scene.uncache(); }),
            switchMap(
                (): Observable<string> => {
                    return this._navigator.stateService.currentNode$.pipe(
                        map(
                            (node: Node): string => {
                                return this._navigator.api.data.geometry
                                    .latLonToCellId(node.latLon);
                            }),
                        distinctUntilChanged());
                }),
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

        const hashes$ = observableCombineLatest(
            earth$,
            hash$,
            sequencePlay$,
            direction$).pipe(
                distinctUntilChanged(
                    (
                        [e1, h1, s1, d1]: [boolean, string, boolean, string],
                        [e2, h2, s2, d2]: [boolean, string, boolean, string]): boolean => {

                        if (e1 !== e2) {
                            return false;
                        }

                        if (e1) {
                            return h1 === h2 && s1 === s2;
                        }

                        return h1 === h2 && s1 === s2 && d1 === d2;
                    }),
                concatMap(
                    ([earth, hash, sequencePlay, direction]: [boolean, string, boolean, string]): Observable<string[]> => {
                        if (earth) {
                            return sequencePlay ?
                                observableOf([hash]) :
                                observableOf(this._adjacentComponent(hash, 1));
                        }

                        return sequencePlay ?
                            observableOf([
                                hash,
                                this._navigator.api.data.geometry
                                    .getAdjacent(hash)[<keyof CellNeighbors>direction]]) :
                            observableOf(this._computeTiles(hash, direction));
                    }),
                publish<string[]>(),
                refCount());

        const tile$: Observable<Cell> = hashes$.pipe(
            switchMap(
                (cellIds: string[]): Observable<Cell> => {
                    return observableFrom(cellIds).pipe(
                        mergeMap(
                            (cellId: string): Observable<Cell> => {
                                const t$ = this._cache.hasTile(cellId) ?
                                    observableOf(this._cache.getTile(cellId)) :
                                    this._cache.cacheTile$(cellId);

                                return t$.pipe(
                                    map((nodes: Node[]) => ({ id: cellId, nodes })));
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
                    this._addSceneNodes(cell, reference);
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
                ([[hash, reconstruction], reference]: [[string, ClusterReconstructionContract], LatLonAlt]): void => {
                    if (this._scene.hasClusterReconstruction(reconstruction.id, hash)) {
                        return;
                    }

                    this._scene.addClusterReconstruction(
                        reconstruction,
                        this._computeTranslation(reconstruction, reference),
                        hash);
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

        subs.push(hash$
            .subscribe(
                (hash: string): void => {
                    const keepHashes = this._adjacentComponent(hash, 1);
                    this._scene.uncache(keepHashes);
                    this._cache.uncache(keepHashes);
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
                ([event, render]: [MouseEvent, RenderCamera]): Observable<Node> => {
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
                                (): Observable<Node> => {
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
                        this._scene.setHoveredNode(null);
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

                    this._scene.setHoveredNode(key);
                }));

        subs.push(this._navigator.stateService.currentId$
            .subscribe(
                (id: string): void => {
                    this._scene.setSelectedNode(id);
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
                            map((nodes: Node[]) => ({ id: cellId, nodes })),
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
                    this._addSceneNodes(cell, reference);
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
                ([[hash, reconstruction], reference]: [[string, ClusterReconstructionContract], LatLonAlt]): void => {
                    if (this._scene.hasClusterReconstruction(reconstruction.id, hash)) {
                        return;
                    }

                    this._scene.addClusterReconstruction(
                        reconstruction,
                        this._computeTranslation(reconstruction, reference),
                        hash);
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

    private _addSceneNodes(cell: Cell, reference: LatLonAlt): void {
        const cellId = cell.id;
        const nodes = cell.nodes;
        for (const node of nodes) {
            if (this._scene.hasNode(node.id, cellId)) { continue; }

            this._scene.addNode(
                node,
                this._createTransform(node, reference),
                this._computeOriginalPosition(node, reference),
                cellId);
        }
    }

    private _adjacentComponent(hash: string, depth: number): string[] {
        const hashSet: Set<string> = new Set<string>();
        hashSet.add(hash);

        this._adjacentComponentRecursive(hashSet, [hash], 0, depth);

        return this._setToArray(hashSet);
    }

    private _adjacentComponentRecursive(
        hashSet: Set<string>,
        currentHashes: string[],
        currentDepth: number,
        maxDepth: number): void {

        if (currentDepth === maxDepth) {
            return;
        }

        const neighbours: string[] = [];

        for (const hash of currentHashes) {
            const hashNeighbours: CellNeighbors =
                this._navigator.api.data.geometry.getAdjacent(hash);

            for (const direction in hashNeighbours) {
                if (!hashNeighbours.hasOwnProperty(direction)) {
                    continue;
                }

                neighbours.push(hashNeighbours[<keyof CellNeighbors>direction]);
            }
        }

        const newHashes: string[] = [];
        for (const neighbour of neighbours) {
            if (!hashSet.has(neighbour)) {
                hashSet.add(neighbour);
                newHashes.push(neighbour);
            }
        }

        this._adjacentComponentRecursive(hashSet, newHashes, currentDepth + 1, maxDepth);
    }

    private _computeOriginalPosition(node: Node, reference: LatLonAlt): number[] {
        return geodeticToEnu(
            node.originalLatLon.lat,
            node.originalLatLon.lon,
            node.originalAltitude != null ? node.originalAltitude : node.computedAltitude,
            reference.lat,
            reference.lon,
            reference.alt);
    }

    private _computeTileBBox(hash: string, reference: LatLonAlt): number[][] {
        const vertices =
            this._navigator.api.data.geometry
                .getVertices(hash)
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

    private _createTransform(node: Node, reference: LatLonAlt): Transform {
        const translation: number[] = Geo.computeTranslation(
            { alt: node.computedAltitude, lat: node.latLon.lat, lon: node.latLon.lon },
            node.rotation,
            reference);

        const transform: Transform = new Transform(
            node.exifOrientation,
            node.width,
            node.height,
            node.scale,
            node.rotation,
            translation,
            undefined,
            undefined,
            node.cameraParameters,
            <CameraType>node.cameraType);

        return transform;
    }

    private _computeTiles(hash: string, direction: string): string[] {
        const hashSet: Set<string> = new Set<string>();
        const directions: string[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

        this._computeTilesRecursive(hashSet, hash, direction, directions, 0, 1);

        return this._setToArray(hashSet);
    }

    private _computeTilesRecursive(
        hashSet: Set<string>,
        currentHash: string,
        direction: string,
        directions: string[],
        currentDepth: number,
        maxDepth: number): void {

        hashSet.add(currentHash);

        if (currentDepth === maxDepth) {
            return;
        }

        const neighbours: CellNeighbors =
            this._navigator.api.data.geometry.getAdjacent(currentHash);
        const directionIndex: number = directions.indexOf(direction);
        const length: number = directions.length;

        const directionNeighbours: string[] = [
            neighbours[<keyof CellNeighbors>directions[this._modulo((directionIndex - 1), length)]],
            neighbours[<keyof CellNeighbors>direction],
            neighbours[<keyof CellNeighbors>directions[this._modulo((directionIndex + 1), length)]],
        ];

        for (let directionNeighbour of directionNeighbours) {
            this._computeTilesRecursive(hashSet, directionNeighbour, direction, directions, currentDepth + 1, maxDepth);
        }
    }

    private _computeTranslation(reconstruction: ClusterReconstructionContract, reference: LatLonAlt): number[] {
        return geodeticToEnu(
            reconstruction.reference.lat,
            reconstruction.reference.lon,
            reconstruction.reference.alt,
            reference.lat,
            reference.lon,
            reference.alt);
    }

    private _modulo(a: number, n: number): number {
        return ((a % n) + n) % n;
    }

    private _setToArray<T>(s: Set<T>): T[] {
        const a: T[] = [];

        s.forEach(
            (value: T) => {
                a.push(value);
            });

        return a;
    }
}
