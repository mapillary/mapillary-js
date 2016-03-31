/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {ComponentService, Component, ICacheConfiguration, ICacheDepth} from "../Component";
import {Container, Navigator} from "../Viewer";

export class CacheComponent extends Component {
    public static componentName: string = "cache";

    private _defaultConfiguration: ICacheConfiguration;

    private _cacheSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._defaultConfiguration = {
            depth: {
                pano: 1,
                sequence: 2,
                step: 1,
            },
        };
    }

    protected _activate(): void {
        this._cacheSubscription = rx.Observable
            .combineLatest(
                this._navigator.stateService.currentNode$,
                this._configuration$,
                (node: Node, configuration: ICacheConfiguration): [Node, ICacheConfiguration] => {
                    return [node, configuration];
                })
            .flatMapLatest<Node>(
                (nc: [Node, ICacheConfiguration]): rx.Observable<Node> => {
                    let node: Node = nc[0];
                    let configuration: ICacheConfiguration = nc[1];

                    let depth: ICacheDepth = configuration.depth != null ?
                        configuration.depth :
                        this._defaultConfiguration.depth;

                    let sequenceDepth: number = Math.max(0, Math.min(4, depth.sequence));
                    let panoDepth: number = Math.max(0, Math.min(2, depth.pano));
                    let stepDepth: number = node.pano ? 0 : Math.max(0, Math.min(3, depth.step));

                    let next$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Next, sequenceDepth);
                    let prev$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Prev, sequenceDepth);

                    let pano$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Pano, panoDepth);

                    let forward$: rx.Observable<Node> = this._cache$(node, EdgeDirection.StepForward, stepDepth);
                    let backward$: rx.Observable<Node> = this._cache$(node, EdgeDirection.StepBackward, stepDepth);
                    let left$: rx.Observable<Node> = this._cache$(node, EdgeDirection.StepLeft, stepDepth);
                    let right$: rx.Observable<Node> = this._cache$(node, EdgeDirection.StepRight, stepDepth);

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
        this._cacheSubscription.dispose();
    }

    private _cache$(node: Node, direction: EdgeDirection, depth: number): rx.Observable<Node> {
        if (depth < 1) {
            return rx.Observable.empty<Node>();
        }

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
