import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/of";

import "rxjs/add/operator/buffer";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/combineLatest";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {ComponentService, Component} from "../Component";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

type Keys = { [key: string]: boolean };

export class StatsComponent extends Component {
    public static componentName: string = "stats";

    private _sequenceSubscription: Subscription;
    private _imageSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._sequenceSubscription = Observable
            .combineLatest(
                this._navigator.stateService.currentNode$,
                Observable.of<Keys>({}))
            .mergeMap<string>(
                (args: [Node, Keys]): Observable<string> => {
                    let sKey: string = args[0].sequence.key;
                    let reportedKeys: Keys = args[1];

                    if (!(sKey in reportedKeys)) {
                        reportedKeys[sKey] = true;

                        return Observable.of<string>(sKey);
                    }

                    return Observable.empty<string>();
                })
            .subscribe(
                (sKey: string): void => {
                    this._navigator.apiV3.modelMagic
                        .call(["sequenceViewAdd"], [[sKey]])
                        .subscribe();
                });

        this._navigator.stateService.currentNode$
            .map<string>(
                (node: Node): string => {
                    return node.key;
                })
            .buffer(this._navigator.stateService.currentNode$.debounceTime(5000))
            .combineLatest(Observable.of<Keys>({}))
            .mergeMap<string[]>(
                (args: [string[], Keys]): Observable<string[]> => {
                    let keys: string[] = args[0];
                    let reportedKeys: Keys = args[1];

                    let reportKeys: string[] = [];

                    for (let key of keys) {
                        if (!(key in reportedKeys)) {
                            reportedKeys[key] = true;
                            reportKeys.push(key);
                        }
                    }

                    return reportKeys.length > 0 ?
                        Observable.of<string[]>(reportKeys) :
                        Observable.empty<string[]>();
                })
            .subscribe(
                (keys: string[]): void => {
                    this._navigator.apiV3.modelMagic
                        .call(["imageViewAdd"], [keys])
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
