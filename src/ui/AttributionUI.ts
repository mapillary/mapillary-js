/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {Node} from "../Graph";

import {UIService, UI} from "../UI";
import {IVNodeHash} from "../Render";

export class AttributionUI extends UI {
    public static uiName: string = "attribution";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            return {name: this._name, vnode: this.getAttributionNode(node.user, node.key)};
        }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
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

UIService.register(AttributionUI);
export default AttributionUI;
