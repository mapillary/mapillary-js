/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as vd from "virtual-dom";
import * as rx from "rx";

import {Container, Navigator} from "../Viewer";
import {IUI} from "../UI";

import {IVNodeHash} from "../Render";

export class LoadingUI implements IUI {
    private container: Container;
    private navigator: Navigator;
    private loadingSubscription: rx.IDisposable;
    private loadingRemainder: number;
    private loadingContainer: any;

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;
        this.loadingRemainder = 50;
        this.loadingContainer = { name: "loading", vnode: this.getBarVNode(this.loadingRemainder) };
    }

    public activate(): void {
        this.loadingSubscription = this.navigator.loadingService.loading$
            .combineLatest(
                this.navigator.graphService.imageLoadingService.loadstatus$,
                (loading: boolean, loadStatus: any): IVNodeHash => {
                    if (!loading) {
                        return {name: "loading", vnode: this.getBarVNode(100)};
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

                    return {name: "loading", vnode: this.getBarVNode(percentage)};
                }).subscribe(this.container.domRenderer.render$);
    }

    public deactivate(): void {
        return;
    }

    private getBarVNode(percentage: number): vd.VNode {
        let style: any = {};
        style.transition = "opacity 1000ms";

        if (percentage !== 100) {
            style.width = percentage.toFixed(0) + "%";
            style.opacity = "1.0";
        } else {
            style.width = "100%";
            style.opacity = "0";
        }

        return vd.h("div.Loading", { style: style }, []);
    }
}

export default LoadingUI;
