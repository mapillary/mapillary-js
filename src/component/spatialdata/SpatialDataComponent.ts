import * as geohash from "latlon-geohash";

import {
    of as observableOf,
    zip as observableZip,
    Observable,
} from "rxjs";

import {
    filter,
    switchMap,
    withLatestFrom,
    map,
    mergeMap,
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
        this._navigator.stateService.currentNode$.pipe(
            map(
                (node: Node): string => {
                    return geohash.encode(node.computedLatLon.lat, node.computedLatLon.lon, 8);
                }),
            filter(
                (hash: string): boolean => {
                    return !(this._cache.hasTile(hash) || this._cache.isCachingTile(hash));
                }),
            switchMap(
                (hash: string): Observable<ReconstructionData> => {
                    return this._cache.cacheTile$(hash);
                }),
            withLatestFrom(this._navigator.stateService.reference$),
            mergeMap(
                ([data, reference]: [ReconstructionData, ILatLonAlt]): Observable<[IReconstruction, Transform]> => {
                    return observableZip(
                        observableOf(data.reconstruction),
                        observableOf(this._createTransform(data.data, reference)));
                },
                6))
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
