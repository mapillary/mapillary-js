/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {ComponentService, Component} from "../Component";
import {Container, Navigator} from "../Viewer";

export class CacheComponent extends Component {
    public static componentName: string = "cache";

    private _nodeSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._nodeSubscription = this._navigator.stateService.currentNode$
            .flatMapLatest<Node>(
                (node: Node): rx.Observable<Node> => {
                    let next$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Next, 1);
                    let prev$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Prev, 1);
                    let pano$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Pano, 1);

                    let forward$: rx.Observable<Node> = node.pano ?
                        rx.Observable.empty<Node>() :
                        this._cache$(node, EdgeDirection.StepForward, 1);

                    let backward$: rx.Observable<Node> = node.pano ?
                        rx.Observable.empty<Node>() :
                        this._cache$(node, EdgeDirection.StepBackward, 1);

                    let left$: rx.Observable<Node> = node.pano ?
                        rx.Observable.empty<Node>() :
                        this._cache$(node, EdgeDirection.StepLeft, 1);

                    let right$: rx.Observable<Node> = node.pano ?
                        rx.Observable.empty<Node>() :
                        this._cache$(node, EdgeDirection.StepRight, 1);

                    return rx.Observable
                        .merge<Node>([
                            next$,
                            prev$,
                            forward$,
                            backward$,
                            left$,
                            right$,
                            pano$,
                        ]);
                })
            .subscribe();
    }

    protected _deactivate(): void {
        this._nodeSubscription.dispose();
    }

    private _cache$(node: Node, direction: EdgeDirection, depth: number): rx.Observable<Node> {
        return rx.Observable
            .just(node)
            .expand(
                (n: Node): rx.Observable<Node> => {
                    for (let edge of n.edges) {
                        if (edge.data.direction === direction) {
                            return this._navigator.graphService.node$(edge.to);
                        }
                    }

                    return rx.Observable.empty<Node>();
                })
            .skip(1)
            .take(depth);
    }
}

ComponentService.register(CacheComponent);
export default CacheComponent;
