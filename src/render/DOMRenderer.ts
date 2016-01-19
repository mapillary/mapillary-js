/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";
import * as vd from "virtual-dom";

export interface IVNodeHash {
    name: string;
    vnode: vd.VNode;
}

interface INodePatch {
    vnode: vd.VNode;
    vpatch: vd.VPatch[];
}

interface IVNodeHashes {
    [name: string]: vd.VNode;
}

export class DOMRenderer {
    private _element$: rx.ConnectableObservable<Element>;
    private _vPatch$: rx.Observable<vd.VPatch[]>;
    private _vNode$: rx.Observable<vd.VNode>;
    private _render$: rx.Subject<any> = new rx.Subject<any>();

    constructor (element: Element) {
        let rootNode: Element = vd.create(vd.h("div.domRenderer", []));
        element.appendChild(rootNode);

        this._vNode$ = this._render$
            .scan<IVNodeHashes>(
            (vNodeHashes: IVNodeHashes, vNodeHash: IVNodeHash): IVNodeHashes => {
                vNodeHashes[vNodeHash.name] = vNodeHash.vnode;
                return vNodeHashes;
            },
            {})
            .map((vNodeHashes: IVNodeHashes): vd.VNode => {
                let vNodes: vd.VNode[] = _.values(vNodeHashes);
                return vd.h("div.domRenderer", vNodes);
            });

        this._vPatch$ = this._vNode$
            .scan<INodePatch>(
            (nodePatch: INodePatch, vNode: vd.VNode): INodePatch => {
                nodePatch.vpatch = vd.diff(nodePatch.vnode, vNode);
                nodePatch.vnode = vNode;
                return nodePatch;
            },
            {vnode: vd.h("div.domRenderer", []), vpatch: null})
            .pluck<vd.VPatch[]>("vpatch");

        this._element$ = this._vPatch$.scan(
            (oldElement: Element, vPatch: vd.VPatch[]): Element => {
                return vd.patch(oldElement, vPatch);
            },
            rootNode)
            .shareReplay(1)
            .publish();
        this._element$.connect();
    }

    public get element$(): rx.Observable<Element> {
        return this._element$;
    }

    public get render$(): rx.Subject<any> {
        return this._render$;
    }
}

export default DOMRenderer;
