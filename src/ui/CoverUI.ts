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
        this.container.domRenderer.render$.onNext({name: "cover", vnode: this.createButton("mapillary-js")});
    }

    public deactivate(): void {
        return;
    }

    private removeCover(): void {
        this.container.domRenderer.render$.onNext({name: "cover", vnode: []});
    }

    private createButton (text: string): vd.VNode {
        return vd.h("div.Cover", [vd.h("button.CoverButton", {innerText: text, onclick: this.removeCover.bind(this)}, [])]);
    }
}

export default CoverUI;
