import {
    empty as observableEmpty,
    of as observableOf,
    zip as observableZip,
    Observable,
    Subscriber,
} from "rxjs";

import {
    switchMap,
    catchError,
    withLatestFrom,
    map,
} from "rxjs/operators";

import {
    ComponentService,
    Component,
    IComponentConfiguration,
    IReconstruction,
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
    Urls,
} from "../../Utils";
import {
    Container,
    Navigator,
} from "../../Viewer";

export class SpatialDataComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "spatialData";

    private _geoCoords: GeoCoords;
    private _scene: SpatialDataScene;
    private _spatial: Spatial;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._geoCoords = new GeoCoords();
        this._scene = new SpatialDataScene();
        this._spatial = new Spatial();
    }

    protected _activate(): void {
        this._navigator.stateService.currentNode$.pipe(
            withLatestFrom(this._navigator.stateService.reference$),
            switchMap(
                ([node, reference]: [Node, ILatLonAlt]): Observable<[IReconstruction, Transform]> => {
                    return observableZip(
                        this._getAtomicReconstruction(node.key),
                        this._createTransform(node, reference)).pipe(
                            catchError(
                                (error: Error): Observable<[IReconstruction, Transform]> => {
                                    console.error(error);

                                    return observableEmpty();
                                }));
                }))
            .subscribe(
                ([reconstruction, transform]: [IReconstruction, Transform]): void => {
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

    private _createTransform(node: Node, reference: ILatLonAlt): Observable<Transform> {
        const C: number[] = this._geoCoords.geodeticToEnu(
            node.latLon.lat,
            node.latLon.lon,
            node.alt,
            reference.lat,
            reference.lon,
            reference.alt);

        const RC: THREE.Vector3 = this._spatial.rotate(C, node.rotation);
        const translation: number[] = [-RC.x, -RC.y, -RC.z];
        const transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            translation,
            node.image,
            undefined,
            node.ck1,
            node.ck2);

        return observableOf(transform);
    }

    private _getAtomicReconstruction(key: string): Observable<IReconstruction> {
        return Observable.create(
            (subscriber: Subscriber<IReconstruction>): void => {
                const xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
                xmlHTTP.open("GET", Urls.atomicReconstruction(key), true);
                xmlHTTP.responseType = "json";
                xmlHTTP.timeout = 15000;

                xmlHTTP.onload = () => {
                    subscriber.next(xmlHTTP.response);
                    subscriber.complete();
                };

                xmlHTTP.onerror = () => {
                    subscriber.error(new Error(`Failed to get atomic reconstruction (${key})`));
                };

                xmlHTTP.ontimeout = () => {
                    subscriber.error(new Error(`Atomic reconstruction request timed out (${key})`));
                };

                xmlHTTP.onabort = () => {
                    subscriber.error(new Error(`Atomic reconstruction request was aborted (${key})`));
                };

                xmlHTTP.send(null);
            });
    }
}

ComponentService.register(SpatialDataComponent);
export default SpatialDataComponent;
