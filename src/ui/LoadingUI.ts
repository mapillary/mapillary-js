/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

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

        this.loadingSubscription = this.navigator
            .loadingService
            .loading$
            .map((loading: boolean): IVNodeHash => {
                return { name: "simplenavui", vnode: this.getBarVNode(this.loadingRemainder)};
            })
            .subscribe(this.container.domRenderer.render$);

    }

    public deactivate(): void {
        return;
    }

    private getBarVNode(remainder: number): vd.VNode {
        let percentage: number = 100 - remainder;
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
