/// <reference path="../../typings/index.d.ts" />

import * as _ from "underscore";
import * as vd from "virtual-dom";
import * as rx from "rx";

import {Container, Navigator} from "../Viewer";
import {ComponentService, Component} from "../Component";

import {IVNodeHash} from "../Render";

export class LoadingComponent extends Component {
    public static componentName: string = "loading";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.loadingService.loading$
            .combineLatest(
                this._navigator.graphService.imageLoadingService.loadstatus$,
                (loading: boolean, loadStatus: any): IVNodeHash => {
                    if (!loading) {
                        return {name: "loading", vnode: this._getBarVNode(100)};
                    }

                    let total: number = 0;
                    let loaded: number = 0;

                    for (let loadStat of _.values(loadStatus)) {
                        if (loadStat.loaded !== loadStat.total) {
                            loaded += loadStat.loaded;
                            total += loadStat.total;
                        }
                    }

                    let percentage: number = 100;
                    if (total !== 0) {
                        percentage = (loaded / total) * 100;
                    }

                    return {name: this._name, vnode: this._getBarVNode(percentage)};
                }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
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
