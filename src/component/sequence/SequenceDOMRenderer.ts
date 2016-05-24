/// <reference path="../../../typings/browser.d.ts" />

import * as vd from "virtual-dom";

import {EdgeDirection} from "../../Edge";
import {Node} from "../../Graph";
import {Navigator} from "../../Viewer";

export class SequenceDOMRenderer {
    public render(node: Node, navigator: Navigator): vd.VNode {
        let arrows: vd.VNode[] = this._createSequenceArrows(node, navigator);

        return vd.h("div", {}, [vd.h("div.InSeq", {}, arrows)]);
    }

    private _createSequenceArrows(node: Node, navigator: Navigator): vd.VNode[] {
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
            { onclick: (e: Event): void => { navigator.moveDir(EdgeDirection.Next).subscribe(); } } :
            { };

        let prevProperties: vd.createProperties = prevExist ?
            { onclick: (e: Event): void => { navigator.moveDir(EdgeDirection.Prev).subscribe(); } } :
            { };

        return [
            vd.h(next, nextProperties, []),
            vd.h(prev, prevProperties, []),
        ];
    }
}

export default SequenceDOMRenderer;
