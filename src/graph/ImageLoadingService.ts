import {refCount, publishReplay, map, filter, scan} from "rxjs/operators";
import {Subject, Observable} from "rxjs";

import {ILoadStatus, Node} from "../Graph";

type LoadStatus = [{ [key: string]: ILoadStatus }, boolean];

export class ImageLoadingService {
    private _loadnode$: Subject<Node> = new Subject<Node>();
    private _loadstatus$: Observable<{[key: string]: ILoadStatus}>;

    constructor () {
        this._loadstatus$ = this._loadnode$.pipe(
            scan<Node, LoadStatus>(
                ([nodes]: LoadStatus, node: Node): [{[key: string]: ILoadStatus}, boolean] => {
                    let changed: boolean = false;
                    if (node.loadStatus.total === 0 || node.loadStatus.loaded === node.loadStatus.total) {
                        if (node.key in nodes) {
                            delete nodes[node.key];
                            changed = true;
                        }
                    } else {
                        nodes[node.key] = node.loadStatus;
                        changed = true;
                    }

                    return [nodes, changed];
                },
                [{}, false]),
            filter(
                ([nodes, changed]: [{[key: string]: ILoadStatus}, boolean]): boolean => {
                    return changed;
                }),
            map(
                ([nodes]: [{[key: string]: ILoadStatus}, boolean]): {[key: string]: ILoadStatus} => {
                    return nodes;
                }),
            publishReplay(1),
            refCount());

        this._loadstatus$.subscribe(() => { /*noop*/ });
    }

    public get loadnode$(): Subject<Node> {
        return this._loadnode$;
    }

    public get loadstatus$(): Observable<{[key: string]: ILoadStatus}> {
        return this._loadstatus$;
    }
}
