/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as vd from "virtual-dom";
import * as rx from "rx";

import {Container, Navigator} from "../Viewer";
import {IUI} from "../UI";

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

        this.loadingSubscription = this.navigator
            .loadingService
            .loading$
            .skip(1) // this ui should start as `loading`
            .subscribe(this.onLoadingChange.bind(this));

    }

    public activate(): void {
        this.container.domRenderer.render$
            .onNext(this.loadingContainer);
    }

    public deactivate(): void {
        return;
    }

    private getBarVNode(remainder: number): any {
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

    private onLoadingChange(loading: any): void {
        if (loading) {
            this.loadingRemainder = 50;
        } else {
            this.loadingRemainder = 0;
        }

        let newNode: any = this.getBarVNode(this.loadingRemainder);
        let patches: any = vd.diff(this.loadingContainer.vnode, newNode);
        this.loadingContainer.vnode = vd.patch(this.loadingContainer.vnode, patches);
    }
}

export default LoadingUI;
