import * as geohash from "latlon-geohash";

import {
    combineLatest as observableCombineLatest,
    from as observableFrom,
    Observable,
} from "rxjs";

import {
    filter,
    withLatestFrom,
    map,
    distinctUntilChanged,
    concatMap,
} from "rxjs/operators";

import {
    ComponentService,
    Component,
    IComponentConfiguration,
    IReconstruction,
    NodeData,
    ReconstructionData,
    SpatialDataCache,
    SpatialDataScene,
} from "../../Component";
import {
    GeoCoords,
    ILatLonAlt,
    Spatial,
    Transform,
} from "../../Geo";
import {
    Node,
} from "../../Graph";
import {
    IGLRenderHash,
    GLRenderStage,
} from "../../Render";
import {
    IFrame,
} from "../../State";
import {
    Container,
    Navigator,
} from "../../Viewer";

export class SpatialDataComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "spatialData";

    private _geoCoords: GeoCoords;
    private _cache: SpatialDataCache;
    private _scene: SpatialDataScene;
    private _spatial: Spatial;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._geoCoords = new GeoCoords();
        this._cache = new SpatialDataCache(navigator.graphService);
        this._scene = new SpatialDataScene();
        this._spatial = new Spatial();
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

        const hash$: Observable<string> = this._navigator.stateService.currentNode$.pipe(
            map(
                (node: Node): string => {
                    return geohash.encode(node.computedLatLon.lat, node.computedLatLon.lon, 8);
                }));

        observableCombineLatest(hash$, direction$).pipe(
            concatMap(
                ([hash, direction]: [string, string]): Observable<string> => {
                    const neighbours: geohash.Neighbours = geohash.neighbours(hash);

                    const hashes: string[] = [hash];
                    hashes.push(neighbours[<keyof geohash.Neighbours>direction]);

                    return observableFrom(hashes);
                }),
            filter(
                (hash: string): boolean => {
                    return !(this._cache.hasTile(hash) || this._cache.isCachingTile(hash));
                }),
            concatMap(
                (hash: string): Observable<ReconstructionData> => {
                    return this._cache.cacheTile$(hash);
                }),
            withLatestFrom(this._navigator.stateService.reference$),
            map(
                ([data, reference]: [ReconstructionData, ILatLonAlt]): [IReconstruction, Transform] => {
                    return [data.reconstruction, this._createTransform(data.data, reference)];
                }))
            .subscribe(
                ([reconstruction, transform]: [IReconstruction, Transform]): void => {
                    if (!transform.hasValidScale) {
                        return;
                    }

                    this._scene.addReconstruction(reconstruction, transform);
                });

        this._navigator.stateService.currentState$.pipe(
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
        return;
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _createTransform(data: NodeData, reference: ILatLonAlt): Transform {
        const C: number[] = this._geoCoords.geodeticToEnu(
            data.lat,
            data.lon,
            data.alt,
            reference.lat,
            reference.lon,
            reference.alt);

        const RC: THREE.Vector3 = this._spatial.rotate(C, data.rotation);
        const translation: number[] = [-RC.x, -RC.y, -RC.z];
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
}

ComponentService.register(SpatialDataComponent);
export default SpatialDataComponent;
