/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

import {ILoadStatus, NewNode} from "../Graph";

export class ImageLoadingService {
    private _loadnode$: Subject<NewNode> = new Subject<NewNode>();
    private _loadstatus$: Observable<{[key: string]: ILoadStatus}>;

    constructor () {
        this._loadstatus$ = this._loadnode$
            .scan<{[key: string]: ILoadStatus}>(
                (nodes: {[key: string]: ILoadStatus}, node: NewNode): {[key: string]: ILoadStatus} => {
                    nodes[node.key] = node.loadStatus;
                    return nodes;
                },
                {})
            .publishReplay(1)
            .refCount();

        this._loadstatus$.subscribe();
    }

    public get loadnode$(): Subject<NewNode> {
        return this._loadnode$;
    }

    public get loadstatus$(): Observable<{[key: string]: ILoadStatus}> {
        return this._loadstatus$;
    }
}
