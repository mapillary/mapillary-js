/// <reference path="../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Subscription} from "rxjs/Subscription";

import {Container, Navigator} from "../Viewer";
import {Node} from "../Graph";

import {ComponentService, Component, IComponentConfiguration} from "../Component";
import {IVNodeHash} from "../Render";

export class AttributionComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "attribution";
    private _disposable: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$
            .map(
                (node: Node): IVNodeHash => {
                    return {name: this._name, vnode: this._getAttributionNode(node.username, node.key)};
                })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _getAttributionNode(username: string, photoId: string): vd.VNode {
        return vd.h("div.Attribution", {}, [
            vd.h("a", {href: `https://www.mapillary.com/app/user/${username}`,
                       target: "_blank",
                       textContent: `@${username}`,
                      },
                 []),
            vd.h("span", {textContent: "|"}, []),
            vd.h("a", {href: `https://www.mapillary.com/app/?pKey=${photoId}&focus=photo`,
                       target: "_blank",
                       textContent: "mapillary.com",
                      },
                 []),
        ]);
    }
}

ComponentService.register(AttributionComponent);
export default AttributionComponent;
