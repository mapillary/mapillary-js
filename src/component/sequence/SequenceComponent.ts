/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../../Viewer";
import {Component, ComponentService, SequenceDOMRenderer} from "../../Component";
import {IVNodeHash} from "../../Render";
import {Node} from "../../Graph";

export class SequenceComponent extends Component {
    public static componentName: string = "sequence";

    private _nodeSubscription: rx.IDisposable;

    private _sequenceDOMRenderer: SequenceDOMRenderer;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._sequenceDOMRenderer = new SequenceDOMRenderer();
    }

    protected _activate(): void {
        this._nodeSubscription = this._navigator.stateService.currentNode$
            .map<IVNodeHash>(
                (node: Node): IVNodeHash => {
                    let vNode: vd.VNode = this._sequenceDOMRenderer.render(node, this._navigator);

                    return {name: this._name, vnode: vNode };
                })
            .subscribe(this._container.domRenderer.render$);
    }

   protected _deactivate(): void {
        this._nodeSubscription.dispose();
    }
}

ComponentService.register(SequenceComponent);
export default SequenceComponent;
