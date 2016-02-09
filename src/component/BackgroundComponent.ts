/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {Node} from "../Graph";

import {ComponentService, Component} from "../Component";
import {IVNodeHash} from "../Render";

export class BackgroundComponent extends Component {
    public static componentName: string = "background";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.map((node: Node): IVNodeHash => {
            return {name: this._name, vnode: this.getBackgroundNode("The viewer can't display the given photo.")};
        }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private getBackgroundNode(notice: string): vd.VNode {
        // todo: add condition for when to display the DOM node
        return vd.h("div.BackgroundWrapper", {}, [
            vd.h("p", {textContent: notice}, [])
        ]);
    }
}

ComponentService.register(BackgroundComponent);
export default BackgroundComponent;
