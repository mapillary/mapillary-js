import * as _ from "underscore";

import {ComponentService, Component} from "../Component";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {Subscription} from "rxjs/Subscription";

interface IStatsViews {
    imKeys: string[];
    sKey: string;
    reportedSKeys: {[key: string]: boolean};
}

export class StatsComponent extends Component {
    public static componentName: string = "stats";

    private _renderSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
         this._renderSubscription = this._navigator.stateService.currentNode$
            .scan(
                (statsViews: IStatsViews, node: Node): IStatsViews => {
                    let sKey: string = node.sequence.key;

                    if (sKey && !statsViews.reportedSKeys[sKey]) {
                        this._navigator.apiV3.modelMagic
                            .call(["sequenceViewAdd"], [[sKey]])
                            .subscribe();
                        statsViews.reportedSKeys[sKey] = true;
                    }
                    statsViews.sKey = node.sequence.key;
                    statsViews.imKeys.push(node.key);
                    statsViews.imKeys = _.uniq(statsViews.imKeys);
                    return statsViews;
                },
                {imKeys: [], reportedSKeys: {}, sKey: null})
            .debounceTime(5000)
            .scan(
                (reportedImKeys: {[key: string]: boolean}, statsViews: IStatsViews): {[key: string]: boolean} => {
                    let reportKeys: string[] = [];

                    for (let imKey of statsViews.imKeys) {
                        if (!reportedImKeys[imKey]) {
                            reportKeys.push(imKey);
                            reportedImKeys[imKey] = true;
                        }
                    }

                    if (reportKeys.length > 0) {
                        this._navigator.apiV3.modelMagic
                            .call(["imageViewAdd"], [reportKeys])
                            .subscribe();
                    }

                    return reportedImKeys;
                },
                {})
            .subscribe();
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
    }
}

ComponentService.register(StatsComponent);
export default StatsComponent;
