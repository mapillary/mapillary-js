/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {UI} from "../UI";

export class CoverUI extends UI {
    public static uiName: string = "cover";

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public _activate(): void {
        this._container.domRenderer.render$.onNext({name: this._name, vnode: this.getCoverButtonVNode()});
    }

    public _deactivate(): void {
        return;
    }

    private removeCover(): void {
        this._container.domRenderer
            .render$
            .onNext({name: this._name, vnode: vd.h("div.Cover.CoverDone", [ this.getCoverBackgroundVNode() ])});
    }

    private getCoverButtonVNode(): vd.VNode {
        return vd.h("div.Cover", [
            this.getCoverBackgroundVNode(),
            vd.h("button.CoverButton", {onclick: this.removeCover.bind(this)}, [
                vd.h("span.CoverButtonIcon", {}, [])
            ]),
        ]);
    }

    private getCoverBackgroundVNode(): vd.VNode {
        let url: string = `url(https://d1cuyjsrcm0gby.cloudfront.net/${this._container.initialPhotoId}/thumb-320.jpg)`;

        return vd.h("div.CoverBackground", { style: { backgroundImage: url }}, []);
    }
}

export default CoverUI;
