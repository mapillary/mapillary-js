import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {ComponentService, Component, IComponentConfiguration} from "../Component";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

type Keys = { [key: string]: boolean };

interface IKeys {
    report: string[];
    reported: Keys;
}

export class StatsComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "stats";

    private _sequenceSubscription: Subscription;
    private _imageSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._sequenceSubscription = this._navigator.stateService.currentNode$
            .scan(
                (keys: IKeys, node: Node): IKeys => {
                    let sKey: string = node.sequenceKey;
                    keys.report = [];

                    if (!(sKey in keys.reported)) {
                        keys.report = [sKey];
                        keys.reported[sKey] = true;
                    }

                    return keys;
                },
                { report: [], reported: {} })
            .filter(
                (keys: IKeys): boolean => {
                    return keys.report.length > 0;
                })
            .mergeMap(
                (keys: IKeys): Observable<void> => {
                    return this._navigator.apiV3.sequenceViewAdd$(keys.report)
                        .catch(
                            (error: Error, caught: Observable<void>): Observable<void> => {
                                console.error(`Failed to report sequence stats (${keys.report})`, error);

                                return Observable.empty<void>();
                            });
                })
            .subscribe(() => { /*noop*/ });

        this._imageSubscription = this._navigator.stateService.currentNode$
            .map(
                (node: Node): string => {
                    return node.key;
                })
            .buffer(this._navigator.stateService.currentNode$.debounceTime(5000))
            .scan(
                 (keys: IKeys, newKeys: string[]): IKeys => {
                     keys.report = [];

                     for (let key of newKeys) {
                        if (!(key in keys.reported)) {
                            keys.report.push(key);
                            keys.reported[key] = true;
                        }
                     }

                     return keys;
                 },
                 { report: [], reported: {} })
             .filter(
                (keys: IKeys): boolean => {
                    return keys.report.length > 0;
                })
            .mergeMap(
                (keys: IKeys): Observable<void> => {
                    return this._navigator.apiV3.imageViewAdd$(keys.report)
                        .catch(
                            (error: Error, caught: Observable<void>): Observable<void> => {
                                console.error(`Failed to report image stats (${keys.report})`, error);

                                return Observable.empty<void>();
                            });
                })
            .subscribe(() => { /*noop*/ });
    }

    protected _deactivate(): void {
        this._sequenceSubscription.unsubscribe();
        this._imageSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }
}

ComponentService.register(StatsComponent);
export default StatsComponent;
