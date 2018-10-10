import {
    empty as observableEmpty,
    Observable,
    Subscriber,
} from "rxjs";

import {
    switchMap,
    catchError,
} from "rxjs/operators";

import {
    ComponentService,
    Component,
    IComponentConfiguration,
    IReconstruction,
} from "../../Component";
import {
    Urls,
} from "../../Utils";
import {
    Container,
    Navigator,
} from "../../Viewer";

export class SpatialDataComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "spatialData";

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._navigator.stateService.currentKey$.pipe(
            switchMap(
                (key: string): Observable<any> => {
                    return this._getAtomicReconstruction(key).pipe(
                        catchError(
                            (error: Error): Observable<IReconstruction> => {
                                console.error(error);

                                return observableEmpty();
                            }));
                }))
            .subscribe(
                (reconstruction: IReconstruction): void => {
                    return;
                });
    }

    protected _deactivate(): void {
        return;
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
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
