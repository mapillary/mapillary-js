/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {Node} from "../Graph";

import {IUI} from "../UI";
import {IVNodeHash} from "../Render";

export class AttributionUI implements IUI {
    private container: Container;
    private navigator: Navigator;
    private subscription: rx.IDisposable;

    private name: string;

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;

        this.name = "attribution";
    }

    public activate(): void {
        this.subscription = this.navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            return {name: this.name, vnode: this.getAttributionNode(node.user, node.key)};
        }).subscribe(this.container.domRenderer.render$);

    }

    public deactivate(): void {
        this.subscription.dispose();
        this.container.domRenderer.clear(this.name);
    }

    private getAttributionNode(username: string, photoId: string): vd.VNode {
        return vd.h("div.Attribution", {}, [
            vd.h("a", {href: `https://www.mapillary.com/profile/${username}`,
                       innerText: `@${username}`,
                       target: "_blank",
                      },
                 []),
            vd.h("span", {innerText: "|"}, []),
            vd.h("a", {href: `https://www.mapillary.com/map/im/${photoId}/photo`,
                       innerText: "mapillary.com",
                       target: "_blank",
                      },
                 []),
        ]);
    }
}

export default AttributionUI;
