/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {UI} from "../UI";

export class CoverUI extends UI {
    public static uiName: string = "cover";
    private _key: string;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public configure(options: any): void {
        this._key = options.key;
    }

    public _activate(): void {
        this._container.domRenderer.render$.onNext({name: "coverOverlay", vnode: this.getCoverButtonVNode()});
    }

    public _deactivate(): void {
        this._container.domRenderer
            .render$
            .onNext({name: "coverOverlay", vnode: vd.h("div.Cover.CoverDone", [ this.getCoverBackgroundVNode() ])});
    }

    private coverButtonPressed(): void {
        this.fire("coverButtonPressed", true);
    }

    private getCoverButtonVNode(): vd.VNode {
        return vd.h("div.Cover", [
            this.getCoverBackgroundVNode(),
            vd.h("button.CoverButton", {onclick: this.coverButtonPressed.bind(this)}, [
                vd.h("span.CoverButtonIcon", {}, [])
            ]),
        ]);
    }

    private getCoverBackgroundVNode(): vd.VNode {
        let url: string = `url(https://d1cuyjsrcm0gby.cloudfront.net/${this._key}/thumb-320.jpg)`;

        return vd.h("div.CoverBackground", { style: { backgroundImage: url }}, []);
    }
}

export default CoverUI;
