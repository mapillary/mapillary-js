/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />

import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {IUI} from "../UI";

export class CoverUI implements IUI {
    private container: Container;
    private navigator: Navigator;

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;
    }

    public activate(): void {
        this.container.domRenderer.render$.onNext({name: "cover", vnode: this.createButton()});
    }

    public deactivate(): void {
        return;
    }

    private removeCover(): void {
        let url: string = "url(https://d1cuyjsrcm0gby.cloudfront.net/ffR697jcoDXhCPae91QqtA/thumb-320.jpg)";
        let node: any = vd.h("div.CoverBackground", {style: { backgroundImage: url }}, []);

        this.container.domRenderer
            .render$
            .onNext({name: "cover", vnode: vd.h("div.Cover.CoverDone", [ node ])});
    }

    private createButton (): vd.VNode {
        let url: string = "url(https://d1cuyjsrcm0gby.cloudfront.net/ffR697jcoDXhCPae91QqtA/thumb-320.jpg)";
        return vd.h("div.Cover", [
            vd.h("div.CoverBackground", { style: { backgroundImage: url }}, []),
            vd.h("button.CoverButton", {onclick: this.removeCover.bind(this)}, [
                vd.h("span.CoverButtonIcon", {}, [])
            ]),
        ]);
    }
}

export default CoverUI;
