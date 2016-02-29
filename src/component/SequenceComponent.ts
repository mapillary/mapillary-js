/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Container, Navigator} from "../Viewer";
import {Component, ComponentService} from "../Component";
import {IVNodeHash} from "../Render";
import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";

export class SequenceComponent extends Component {
    public static componentName: string = "sequence";

    private _nodeSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._nodeSubscription = this._navigator.stateService.currentNode$
            .map<IVNodeHash>(
                (node: Node): IVNodeHash => {
                    let sequence: vd.VNode[] = this._createSequenceArrows(node);

                    return {name: this._name, vnode: this._getVNodeContainer(sequence)};
                })
            .subscribe(this._container.domRenderer.render$);
    }

   protected _deactivate(): void {
        this._nodeSubscription.dispose();
    }

    private _createSequenceArrows(node: Node): vd.VNode[] {
        let nextExist: boolean = false;
        let prevExist: boolean = false;

        for (let edge of node.edges) {
            if (edge.data.direction === EdgeDirection.Next) {
                nextExist = true;
            }

            if (edge.data.direction === EdgeDirection.Prev) {
                prevExist = true;
            }
        }

        let next: string = "div.NextInSeq" + (nextExist ? "" : ".InSeqDisabled");
        let prev: string = "div.PrevInSeq" + (prevExist ? "" : ".InSeqDisabled");

        let nextProperties: vd.createProperties = nextExist ?
            { onclick: (e: Event): void => { this._navigator.moveDir(EdgeDirection.Next).subscribe(); } } :
            { };

        let prevProperties: vd.createProperties = prevExist ?
            { onclick: (e: Event): void => { this._navigator.moveDir(EdgeDirection.Prev).subscribe(); } } :
            { };

        return [
            vd.h(next, nextProperties, []),
            vd.h(prev, prevProperties, []),
        ];
    }

    private _getVNodeContainer(sequence: vd.VNode[]): any {
        return vd.h("div", {}, [vd.h("div.InSeq", {}, sequence)]);
    }
}

ComponentService.register(SequenceComponent);
export default SequenceComponent;
