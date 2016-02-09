/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {Node} from "../Graph";

import {ComponentService, Component} from "../Component";
import {IVNodeHash} from "../Render";

export class RouteComponent extends Component {
    public static componentName: string = "route";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            return {name: this._name, vnode: this.getRouteAnnotationNode("test")};
        }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private getRouteAnnotationNode(text: string): vd.VNode {
        return vd.h("div.RouteFrame", {}, [
            vd.h("p", {textContent: text}, [])
        ]);
    }
}

ComponentService.register(RouteComponent);
export default RouteComponent;
