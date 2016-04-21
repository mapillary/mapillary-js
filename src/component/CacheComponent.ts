/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {ComponentService, Component, ICacheConfiguration, ICacheDepth} from "../Component";
import {Container, Navigator} from "../Viewer";

type NodeDepth = [Node, number];

export class CacheComponent extends Component {
    public static componentName: string = "cache";

    private _cacheSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public get defaultConfiguration(): ICacheConfiguration {
        return { depth: { pano: 1, sequence: 2, step: 1, turn: 0 } };
    }

    /**
     * Set the cache depth.
     *
     * Configures the cache depth. The cache depth can be different for
     * different edge direction types.
     *
     * @param {ICacheDepth} depth - Cache depth structure.
     */
    public setDepth(depth: ICacheDepth): void {
        this.configure({ depth: depth });
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

                    let depth: ICacheDepth = configuration.depth;

                    let sequenceDepth: number = Math.max(0, Math.min(4, depth.sequence));
                    let panoDepth: number = Math.max(0, Math.min(2, depth.pano));
                    let stepDepth: number = node.pano ? 0 : Math.max(0, Math.min(3, depth.step));
                    let turnDepth: number = node.pano ? 0 : Math.max(0, Math.min(1, depth.turn));

                    let next$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Next, sequenceDepth);
                    let prev$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Prev, sequenceDepth);

                    let pano$: rx.Observable<Node> = this._cache$(node, EdgeDirection.Pano, panoDepth);

                    let forward$: rx.Observable<Node> = this._cache$(node, EdgeDirection.StepForward, stepDepth);
                    let backward$: rx.Observable<Node> = this._cache$(node, EdgeDirection.StepBackward, stepDepth);
                    let left$: rx.Observable<Node> = this._cache$(node, EdgeDirection.StepLeft, stepDepth);
                    let right$: rx.Observable<Node> = this._cache$(node, EdgeDirection.StepRight, stepDepth);

                    let turnLeft$: rx.Observable<Node> = this._cache$(node, EdgeDirection.TurnLeft, turnDepth);
                    let turnRight$: rx.Observable<Node> = this._cache$(node, EdgeDirection.TurnRight, turnDepth);
                    let turnU$: rx.Observable<Node> = this._cache$(node, EdgeDirection.TurnU, turnDepth);

                    return rx.Observable
                        .merge<Node>([
                                next$,
                                prev$,
                                forward$,
                                backward$,
                                left$,
                                right$,
                                pano$,
                                turnLeft$,
                                turnRight$,
                                turnU$,
                            ])
                        .distinct((n: Node): string => { return n.key; });
                })
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => { console.error(e); });
    }

    protected _deactivate(): void {
        this._cacheSubscription.dispose();
    }

    private _cache$(node: Node, direction: EdgeDirection, depth: number): rx.Observable<Node> {
        return rx.Observable
            .just<NodeDepth>([node, depth])
            .expand(
                (nd: NodeDepth): rx.Observable<NodeDepth> => {
                    let n: Node = nd[0];
                    let d: number = nd[1];

                    let nodes$: rx.Observable<NodeDepth>[] = [rx.Observable.empty<NodeDepth>()];

                    if (d > 0) {
                        for (let edge of n.edges) {
                            if (edge.data.direction === direction) {
                                nodes$.push(
                                    rx.Observable
                                        .zip<Node, number, NodeDepth>(
                                            this._navigator.graphService.node$(edge.to),
                                            rx.Observable.just<number>(d - 1)));
                            }
                        }
                    }

                    return rx.Observable.merge(nodes$);
                })
            .skip(1)
            .map<Node>((nd: NodeDepth): Node => { return nd[0]; });
    }
}

ComponentService.register(CacheComponent);
export default CacheComponent;
