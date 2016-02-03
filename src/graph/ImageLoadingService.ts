/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {ILoadStatus, Node} from "../Graph";

export class ImageLoadingService {
    private _loadnode$: rx.Subject<Node> = new rx.Subject<Node>();
    private _loadstatus$: rx.Observable<{[key: string]: ILoadStatus}>;

    constructor () {
        this._loadstatus$ = this._loadnode$.scan<{[key: string]: ILoadStatus}>(
        (nodes: {[key: string]: ILoadStatus}, node: Node): {[key: string]: ILoadStatus} => {
            nodes[node.key] = node.loadStatus;
            return nodes;
        },
        {}).shareReplay(1);
        this._loadstatus$.subscribe();
    }

    public get loadnode$(): rx.Subject<Node> {
        return this._loadnode$;
    }

    public get loadstatus$(): rx.Observable<{[key: string]: ILoadStatus}> {
        return this._loadstatus$;
    }
}
