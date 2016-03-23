/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {Node} from "../Graph";

import {ComponentService, Component} from "../Component";
import {IVNodeHash} from "../Render";

export class AttributionComponent extends Component {
    public static componentName: string = "attribution";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            return {name: this._name, vnode: this._getAttributionNode(node.user, node.key)};
        }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private _getAttributionNode(username: string, photoId: string): vd.VNode {
        return vd.h("div.Attribution", {}, [
            vd.h("a", {href: `https://www.mapillary.com/profile/${username}`,
                       target: "_blank",
                       textContent: `@${username}`,
                      },
                 []),
            vd.h("span", {textContent: "|"}, []),
            vd.h("a", {href: `https://www.mapillary.com/map/im/${photoId}/photo`,
                       target: "_blank",
                       textContent: "mapillary.com",
                      },
                 []),
        ]);
    }
}

ComponentService.register(AttributionComponent);
export default AttributionComponent;
