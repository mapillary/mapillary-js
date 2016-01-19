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
        this.loadingRemainder = 20;
        this.loadingContainer = { name: "loading", vnode: this.getBarVNode() };

        this.loadingSubscription = this.navigator
            .loadingService
            .loading$
            .subscribe(this.onLoadingChange.bind(this));
    }

    public activate(): void {
        this.container.domRenderer.render$
            .onNext(this.loadingContainer);
    }

    public deactivate(): void {
        return;
    }

    private getBarVNode(): any {
        return vd.h("div.Loading", { style: { width: this.loadingRemainder.toFixed(0) + "%"} }, []);
    }

    private onLoadingChange(loading: any): void {
        let calculatedRemainder: number = Math.random() * 100;
        this.loadingRemainder = calculatedRemainder / 2;

        // update the vdom progress here
    }
}

export default LoadingUI;
