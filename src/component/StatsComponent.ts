import {Subscription} from "rxjs/Subscription";

import "rxjs/add/operator/buffer";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/scan";

import {ComponentService, Component} from "../Component";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

type Keys = { [key: string]: boolean };

interface IKeys {
    report: string[];
    reported: Keys;
}

export class StatsComponent extends Component {
    public static componentName: string = "stats";

    private _sequenceSubscription: Subscription;
    private _imageSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._sequenceSubscription = this._navigator.stateService.currentNode$
            .scan<IKeys>(
                (keys: IKeys, node: Node): IKeys => {
                    let sKey: string = node.sequence.key;
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
            .subscribe(
                (keys: IKeys): void => {
                    this._navigator.apiV3.modelMagic
                        .call(["sequenceViewAdd"], [keys.report])
                        .subscribe();
                });

        this._imageSubscription = this._navigator.stateService.currentNode$
            .map<string>(
                (node: Node): string => {
                    return node.key;
                })
            .buffer(this._navigator.stateService.currentNode$.debounceTime(5000))
            .scan<IKeys>(
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
            .subscribe(
                (keys: IKeys): void => {
                    this._navigator.apiV3.modelMagic
                        .call(["imageViewAdd"], [keys.report])
                        .subscribe();
                });
    }

    protected _deactivate(): void {
        this._sequenceSubscription.unsubscribe();
        this._imageSubscription.unsubscribe();
    }
}

ComponentService.register(StatsComponent);
export default StatsComponent;
