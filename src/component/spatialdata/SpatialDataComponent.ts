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
    share,
    switchMap,
    tap,
    filter,
    last,
    mergeMap,
} from "rxjs/operators";

import {
    ComponentService,
    Component,
    IReconstruction,
    ISpatialDataConfiguration,
    NodeData,
    ReconstructionData,
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

export class SpatialDataComponent extends Component<ISpatialDataConfiguration> {
    public static componentName: string = "spatialData";

    private _cache: SpatialDataCache;
    private _scene: SpatialDataScene;
    private _viewportCoords: ViewportCoords;
    private _geoCoords: GeoCoords;

    private _addSubscription: Subscription;
    private _cameraVisibilitySubscription: Subscription;
    private _moveSubscription: Subscription;
    private _pointVisibilitySubscription: Subscription;
    private _positionVisibilitySubscription: Subscription;
    private _renderSubscription: Subscription;
    private _uncacheSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._cache = new SpatialDataCache(navigator.graphService);
        this._scene = new SpatialDataScene(this._getDefaultConfiguration);
        this._viewportCoords = new ViewportCoords();
        this._geoCoords = new GeoCoords();
    }

    protected _activate(): void {
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
            distinctUntilChanged());

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
            share());

        const sequencePlay$: Observable<boolean> = observableCombineLatest(
            this._navigator.playService.playing$,
            this._navigator.playService.speed$).pipe(
            map(
                ([playing, speed]: [boolean, number]): boolean => {
                    return playing && speed > PlayService.sequenceSpeed;
                }),
            distinctUntilChanged());

        this._addSubscription = observableCombineLatest(
            hash$,
            direction$,
            sequencePlay$).pipe(
            mergeMap(
                ([hash, direction, sequencePlay]: [string, string, boolean]): Observable<string> => {
                    return sequencePlay ?
                        observableFrom([hash, geohash.neighbours(hash)[<keyof geohash.Neighbours>direction]]) :
                        observableFrom(this._computeTiles(hash, direction));
                }),
            concatMap(
                (hash: string): Observable<[string, ReconstructionData]> => {
                    let tile$: Observable<ReconstructionData>;

                    if (this._cache.hasTile(hash)) {
                        tile$ = observableFrom(this._cache.getTile(hash));
                    } else if (this._cache.isCachingTile(hash)) {
                        tile$ = this._cache.cacheTile$(hash).pipe(
                            last(null, {}),
                            switchMap(
                                (): Observable<ReconstructionData> => {
                                    return observableFrom(this._cache.getTile(hash));
                                }));
                    } else {
                        tile$ = this._cache.cacheTile$(hash);
                    }

                    return observableCombineLatest(observableOf(hash), tile$);
                }),
            withLatestFrom(this._navigator.stateService.reference$),
            filter(
                ([[hash, data]]: [[string, ReconstructionData], ILatLonAlt]): boolean => {
                    return !this._scene.hasReconstruction(data.reconstruction.main_shot, hash);
                }),
            map(
                ([[hash, data], reference]: [[string, ReconstructionData], ILatLonAlt]): [IReconstruction, Transform, number[], string] => {
                    return [
                        data.reconstruction,
                        this._createTransform(data.data, reference),
                        this._computeOriginalPosition(data.data, reference),
                        hash];
                }))
            .subscribe(
                ([reconstruction, transform, position, hash]: [IReconstruction, Transform, number[], string]): void => {
                    this._scene.addReconstruction(reconstruction, transform, position, hash);
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

        this._uncacheSubscription = hash$
            .subscribe(
                (hash: string): void => {
                    this._scene.uncache(this._adjacentComponent(hash, 3));
                    this._cache.uncache(this._adjacentComponent(hash, 4));
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

        this._addSubscription.unsubscribe();
        this._cameraVisibilitySubscription.unsubscribe();
        this._moveSubscription.unsubscribe();
        this._pointVisibilitySubscription.unsubscribe();
        this._positionVisibilitySubscription.unsubscribe();
        this._renderSubscription.unsubscribe();
        this._uncacheSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): ISpatialDataConfiguration {
        return { camerasVisible: false, pointsVisible: true, positionsVisible: false };
    }

    private _adjacentComponent(hash: string, depth: number): string[] {
        const hashSet: Set<string> = new Set<string>();
        hashSet.add(hash);

        this._adjacentComponentRecursive(hashSet, hash, 0, depth);

        return this._setToArray(hashSet);
    }

    private _adjacentComponentRecursive(
        hashSet: Set<string>,
        currentHash: string,
        currentDepth: number,
        maxDepth: number): void {

        if (currentDepth === maxDepth) {
            return;
        }

        const neighbours: geohash.Neighbours = geohash.neighbours(currentHash);

        const newHashes: string[] = [];
        for (const direction in neighbours) {
            if (!neighbours.hasOwnProperty(direction)) {
                continue;
            }

            const neighbour: string = neighbours[<keyof geohash.Neighbours>direction];

            if (!hashSet.has(neighbour)) {
                hashSet.add(neighbour);
                newHashes.push(neighbour);
            }
        }

        for (const newHash of newHashes) {
            this._adjacentComponentRecursive(hashSet, newHash, currentDepth + 1, maxDepth);
        }
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
            data.k2);

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
