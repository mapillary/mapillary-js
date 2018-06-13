import {of as observableOf, Observable, Subscription} from "rxjs";

import {map, switchMap} from "rxjs/operators";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {ComponentService, Component, IComponentConfiguration} from "../Component";

import {IVNodeHash} from "../Render";
import {ILoadStatus} from "../Graph";

export class LoadingComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "loading";

    private _loadingSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._loadingSubscription = this._navigator.loadingService.loading$.pipe(
            switchMap(
                (loading: boolean): Observable<{ [key: string]: ILoadStatus }> => {
                    return loading ?
                        this._navigator.imageLoadingService.loadstatus$ :
                        observableOf({});
                }),
            map(
                (loadStatus: { [key: string]: ILoadStatus }): IVNodeHash => {
                    let total: number = 0;
                    let loaded: number = 0;

                    for (const key in loadStatus) {
                        if (!loadStatus.hasOwnProperty(key)) {
                            continue;
                        }

                        const status: ILoadStatus = loadStatus[key];

                        if (status.loaded !== status.total) {
                            loaded += status.loaded;
                            total += status.total;
                        }
                    }

                    let percentage: number = 100;
                    if (total !== 0) {
                        percentage = (loaded / total) * 100;
                    }

                    return {name: this._name, vnode: this._getBarVNode(percentage)};
                }))
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._loadingSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _getBarVNode(percentage: number): vd.VNode {
        let loadingBarStyle: any = {};
        let loadingContainerStyle: any = {};

        if (percentage !== 100) {
            loadingBarStyle.width = percentage.toFixed(0) + "%";
            loadingBarStyle.opacity = "1";

        } else {
            loadingBarStyle.width = "100%";
            loadingBarStyle.opacity = "0";
        }

        return vd.h("div.Loading", { style: loadingContainerStyle }, [ vd.h("div.LoadingBar", {style: loadingBarStyle}, [])]);
    }
}

ComponentService.register(LoadingComponent);
export default LoadingComponent;
