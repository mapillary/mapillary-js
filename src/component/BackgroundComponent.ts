/// <reference path="../../typings/browser.d.ts" />

import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";

import {ComponentService, Component} from "../Component";

export class BackgroundComponent extends Component {
    public static componentName: string = "background";

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._container.domRenderer.render$
            .onNext({name: this._name, vnode: this.getBackgroundNode("The viewer can't display the given photo.")});
    }

    protected _deactivate(): void {
        return;
    }

    private getBackgroundNode(notice: string): vd.VNode {
        // todo: add condition for when to display the DOM node
        return vd.h("div.BackgroundWrapper", {}, [
            vd.h("p", {textContent: notice}, []),
        ]);
    }
}

ComponentService.register(BackgroundComponent);
export default BackgroundComponent;
