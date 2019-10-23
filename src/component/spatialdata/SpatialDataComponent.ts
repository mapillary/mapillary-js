import * as geohash from "latlon-geohash";

import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    Observable,
    Subscription,
} from "rxjs";

import {
    catchError,
    withLatestFrom,
    map,
    distinctUntilChanged,
    concatMap,
    switchMap,
    tap,
    filter,
    last,
    mergeMap,
    first,
    refCount,
    publishReplay,
    publish,
} from "rxjs/operators";

import {
    ComponentService,
    Component,
    ISpatialDataConfiguration,
    NodeData,
    SpatialDataCache,
    SpatialDataScene,
} from "../../Component";
import {
    Geo,
    GeoCoords,
    ILatLonAlt,
    Transform,
    ViewportCoords,
} from "../../Geo";
import {
    Node,
} from "../../Graph";
import {
    IGLRenderHash,
    GLRenderStage,
    RenderCamera,
} from "../../Render";
import {
    IFrame,
} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";
import PlayService from "../../viewer/PlayService";
import State from "../../state/State";
import IClusterReconstruction from "./interfaces/IClusterReconstruction";
import CameraVisualizationMode from "./CameraVisualizationMode";

export class SpatialDataComponent extends Component<ISpatialDataConfiguration> {
    public static componentName: string = "spatialData";

    private _cache: SpatialDataCache;
    private _scene: SpatialDataScene;
    private _viewportCoords: ViewportCoords;
    private _geoCoords: GeoCoords;

    private _addNodeSubscription: Subscription;
    private _addReconstructionSubscription: Subscription;
    private _addTileSubscription: Subscription;
    private _cameraVisibilitySubscription: Subscription;
    private _earthControlsSubscription: Subscription;
    private _moveSubscription: Subscription;
    private _pointVisibilitySubscription: Subscription;
    private _positionVisibilitySubscription: Subscription;
    private _renderSubscription: Subscription;
    private _tileVisibilitySubscription: Subscription;
    private _uncacheSubscription: Subscription;
    private _cameraVisualizationModeSubscription: Subscription;
    private _ccToModeSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._cache = new SpatialDataCache(navigator.graphService);
        this._scene = new SpatialDataScene(this._getDefaultConfiguration());
        this._viewportCoords = new ViewportCoords();
        this._geoCoords = new GeoCoords();
    }

    protected _activate(): void {
        this._earthControlsSubscription = this._configuration$.pipe(
            map(
                (configuration: ISpatialDataConfiguration): boolean => {
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
                });

        const direction$: Observable<string> = this._container.renderService.bearing$.pipe(
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

        const hash$: Observable<string> = this._navigator.stateService.reference$.pipe(
            tap(
                (): void => {
                    this._scene.uncache();
                }),
            switchMap(
                (): Observable<string> => {
                    return this._navigator.stateService.currentNode$.pipe(
                        map(
                            (node: Node): string => {
                                return geohash.encode(node.latLon.lat, node.latLon.lon, 8);
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

        const hashes$: Observable<string[]> = observableCombineLatest(
            this._navigator.stateService.state$.pipe(
                map(
                    (state: State): boolean => {
                        return state === State.Earth;
                    }),
                distinctUntilChanged()),
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
                            observableOf(this._adjacentComponent(hash, 4));
                    }

                    return sequencePlay ?
                        observableOf([hash, geohash.neighbours(hash)[<keyof geohash.Neighbours>direction]]) :
                        observableOf(this._computeTiles(hash, direction));
                }),
            publish(),
            refCount());

        const tile$: Observable<[string, NodeData[]]> = hashes$.pipe(
            switchMap(
                (hashes: string[]): Observable<[string, NodeData[]]> => {
                    return observableFrom(hashes).pipe(
                        mergeMap(
                            (h: string): Observable<[string, NodeData[]]> => {
                                const t$: Observable<NodeData[]> =
                                    this._cache.hasTile(h) ?
                                        observableOf(this._cache.getTile(h)) :
                                        this._cache.cacheTile$(h);

                                return observableCombineLatest(observableOf(h), t$);
                            },
                            6));
                        }),
            publish(),
            refCount());

        this._addTileSubscription = tile$.pipe(
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([[hash], reference]: [[string, NodeData[]], ILatLonAlt]): void => {
                    if (this._scene.hasTile(hash)) {
                        return;
                    }

                    this._scene.addTile(this._computeTileBBox(hash, reference), hash);
                });

        this._addNodeSubscription = tile$.pipe(
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([[hash, datas], reference]: [[string, [NodeData]], ILatLonAlt]): void => {
                    for (const data of datas) {
                        if (this._scene.hasNode(data.key, hash)) {
                            continue;
                        }

                        this._scene.addNode(
                            data,
                            this._createTransform(data, reference),
                            this._computeOriginalPosition(data, reference),
                            hash);
                        }
                });

        this._addReconstructionSubscription = tile$.pipe(
            concatMap(
                ([hash]: [string, NodeData[]]): Observable<[string, IClusterReconstruction]> => {
                    let reconstructions$: Observable<IClusterReconstruction>;

                    if (this._cache.hasClusterReconstructions(hash)) {
                        reconstructions$ = observableFrom(this._cache.getClusterReconstructions(hash));
                    } else if (this._cache.isCachingClusterReconstructions(hash)) {
                        reconstructions$ = this._cache.cacheClusterReconstructions$(hash).pipe(
                            last(null, {}),
                            switchMap(
                                (): Observable<IClusterReconstruction> => {
                                    return observableFrom(this._cache.getClusterReconstructions(hash));
                                }));
                    } else if (this._cache.hasTile(hash)) {
                        reconstructions$ = this._cache.cacheClusterReconstructions$(hash);
                    } else {
                        reconstructions$ = observableEmpty();
                    }

                    return observableCombineLatest(observableOf(hash), reconstructions$);
                }),
            withLatestFrom(this._navigator.stateService.reference$))
            .subscribe(
                ([[hash, reconstruction], reference]: [[string, IClusterReconstruction], ILatLonAlt]): void => {
                    if (this._scene.hasClusterReconstruction(reconstruction.key, hash)) {
                        return;
                    }

                    this._scene.addClusterReconstruction(
                        reconstruction,
                        this._computeTranslation(reconstruction, reference),
                        hash);
                });

        this._cameraVisibilitySubscription = this._configuration$.pipe(
            map(
                (configuration: ISpatialDataConfiguration): boolean => {
                    return configuration.camerasVisible;
                }),
            distinctUntilChanged())
            .subscribe(
                (visible: boolean): void => {
                    this._scene.setCameraVisibility(visible);
                });

        this._pointVisibilitySubscription = this._configuration$.pipe(
            map(
                (configuration: ISpatialDataConfiguration): boolean => {
                    return configuration.pointsVisible;
                }),
            distinctUntilChanged())
            .subscribe(
                (visible: boolean): void => {
                    this._scene.setPointVisibility(visible);
                });

        this._positionVisibilitySubscription = this._configuration$.pipe(
            map(
                (configuration: ISpatialDataConfiguration): boolean => {
                    return configuration.positionsVisible;
                }),
            distinctUntilChanged())
            .subscribe(
                (visible: boolean): void => {
                    this._scene.setPositionVisibility(visible);
                });

        this._tileVisibilitySubscription = this._configuration$.pipe(
            map(
                (configuration: ISpatialDataConfiguration): boolean => {
                    return configuration.tilesVisible;
                }),
            distinctUntilChanged())
            .subscribe(
                (visible: boolean): void => {
                    this._scene.setTileVisibility(visible);
                });

        this._ccToModeSubscription = this._configuration$.pipe(
            map(
                (configuration: ISpatialDataConfiguration): CameraVisualizationMode => {
                    return configuration.connectedComponents === true ?
                        CameraVisualizationMode.ConnectedComponent :
                        CameraVisualizationMode.Default;
                }),
            distinctUntilChanged())
            .subscribe(
                (mode: CameraVisualizationMode): void => {
                    this.configure({ cameraVisualizationMode: mode });
                });

        this._cameraVisualizationModeSubscription = this._configuration$.pipe(
            map(
                (configuration: ISpatialDataConfiguration): CameraVisualizationMode => {
                    return configuration.cameraVisualizationMode;
                }),
            distinctUntilChanged())
            .subscribe(
                (mode: CameraVisualizationMode): void => {
                    this._scene.setCameraVisualizationMode(mode);
                });

        this._uncacheSubscription = hash$
            .subscribe(
                (hash: string): void => {
                    const keepHashes: string[] = this._adjacentComponent(hash, 4);
                    this._scene.uncache(keepHashes);
                    this._cache.uncache(keepHashes);
                });

        this._moveSubscription = this._navigator.playService.playing$.pipe(
            switchMap(
                (playing: boolean): Observable<MouseEvent> => {
                    return playing ?
                        observableEmpty() :
                        this._container.mouseService.dblClick$;
                }),
            withLatestFrom(this._container.renderService.renderCamera$),
            switchMap(
                ([event, render]: [MouseEvent, RenderCamera]): Observable<Node> => {
                    const element: HTMLElement = this._container.element;
                    const [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);
                    const viewport: number[] = this._viewportCoords.canvasToViewport(
                        canvasX,
                        canvasY,
                        element);

                    const key: string = this._scene.intersectObjects(viewport, render.perspective);

                    return !!key ?
                        this._navigator.moveToKey$(key).pipe(
                            catchError(
                                (): Observable<Node> => {
                                    return observableEmpty();
                                })) :
                        observableEmpty();
                }))
            .subscribe();

        this._renderSubscription = this._navigator.stateService.currentState$.pipe(
            map(
                (frame: IFrame): IGLRenderHash => {
                    const scene: SpatialDataScene = this._scene;

                    return {
                        name: this._name,
                        render: {
                            frameId: frame.id,
                            needsRender: scene.needsRender,
                            render: scene.render.bind(scene),
                            stage: GLRenderStage.Foreground,
                        },
                    };
                }))
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        this._cache.uncache();
        this._scene.uncache();

        this._addNodeSubscription.unsubscribe();
        this._addReconstructionSubscription.unsubscribe();
        this._addTileSubscription.unsubscribe();
        this._cameraVisibilitySubscription.unsubscribe();
        this._earthControlsSubscription.unsubscribe();
        this._moveSubscription.unsubscribe();
        this._pointVisibilitySubscription.unsubscribe();
        this._positionVisibilitySubscription.unsubscribe();
        this._renderSubscription.unsubscribe();
        this._tileVisibilitySubscription.unsubscribe();
        this._uncacheSubscription.unsubscribe();
        this._cameraVisualizationModeSubscription.unsubscribe();
        this._ccToModeSubscription.unsubscribe();

        this._navigator.stateService.state$.pipe(
            first())
            .subscribe(
                (state: State): void => {
                    if (state === State.Earth) {
                        this._navigator.stateService.traverse();
                    }
                });
    }

    protected _getDefaultConfiguration(): ISpatialDataConfiguration {
        return {
            cameraVisualizationMode: CameraVisualizationMode.Default,
            camerasVisible: false,
            connectedComponents: false,
            pointsVisible: true,
            positionsVisible: false,
            tilesVisible: false,
        };
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
            const hashNeighbours: geohash.Neighbours = geohash.neighbours(hash);

            for (const direction in hashNeighbours) {
                if (!hashNeighbours.hasOwnProperty(direction)) {
                    continue;
                }

                neighbours.push(hashNeighbours[<keyof geohash.Neighbours>direction]);
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

    private _computeOriginalPosition(data: NodeData, reference: ILatLonAlt): number[] {
        return this._geoCoords.geodeticToEnu(
            data.originalLat,
            data.originalLon,
            data.alt,
            reference.lat,
            reference.lon,
            reference.alt);
    }

    private _computeTileBBox(hash: string, reference: ILatLonAlt): number[][] {
        const bounds: geohash.Bounds = geohash.bounds(hash);

        const sw: number[] = this._geoCoords.geodeticToEnu(
            bounds.sw.lat,
            bounds.sw.lon,
            0,
            reference.lat,
            reference.lon,
            reference.alt);

        const ne: number[] = this._geoCoords.geodeticToEnu(
            bounds.ne.lat,
            bounds.ne.lon,
            0,
            reference.lat,
            reference.lon,
            reference.alt);

        return [sw, ne];
    }

    private _createTransform(data: NodeData, reference: ILatLonAlt): Transform {
        const translation: number[] = Geo.computeTranslation(
            { alt: data.alt, lat: data.lat, lon: data.lon },
            data.rotation,
            reference);

        const transform: Transform = new Transform(
            data.orientation,
            data.width,
            data.height,
            data.focal,
            data.scale,
            data.gpano,
            data.rotation,
            translation,
            undefined,
            undefined,
            data.k1,
            data.k2,
            data.cameraProjection);

        return transform;
    }

    private _computeTiles(hash: string, direction: string): string[] {
        const hashSet: Set<string> = new Set<string>();
        const directions: string[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

        this._computeTilesRecursive(hashSet, hash, direction, directions, 0, 2);

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

        const neighbours: geohash.Neighbours = geohash.neighbours(currentHash);
        const directionIndex: number = directions.indexOf(direction);
        const length: number = directions.length;

        const directionNeighbours: string[] = [
            neighbours[<keyof geohash.Neighbours>directions[this._modulo((directionIndex - 1), length)]],
            neighbours[<keyof geohash.Neighbours>direction],
            neighbours[<keyof geohash.Neighbours>directions[this._modulo((directionIndex + 1), length)]],
        ];

        for (let directionNeighbour of directionNeighbours) {
            this._computeTilesRecursive(hashSet, directionNeighbour, direction, directions, currentDepth + 1, maxDepth);
        }
    }

    private _computeTranslation(reconstruction: IClusterReconstruction, reference: ILatLonAlt): number[] {
        return this._geoCoords.geodeticToEnu(
            reconstruction.reference_lla.latitude,
            reconstruction.reference_lla.longitude,
            reconstruction.reference_lla.altitude,
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

ComponentService.register(SpatialDataComponent);
export default SpatialDataComponent;
