import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/combineLatest";
import "rxjs/add/observable/merge";
import "rxjs/add/observable/of";
import "rxjs/add/observable/zip";

import "rxjs/add/operator/distinct";
import "rxjs/add/operator/expand";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeAll";
import "rxjs/add/operator/skip";
import "rxjs/add/operator/switchMap";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {ComponentService, Component, ICacheConfiguration, ICacheDepth} from "../Component";
import {Container, Navigator} from "../Viewer";

type NodeDepth = [Node, number];

export class CacheComponent extends Component {
    public static componentName: string = "cache";

    private _cacheSubscription: Subscription;

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
        this._cacheSubscription = Observable
            .combineLatest<Node, ICacheConfiguration>(
                this._navigator.stateService.currentNode$,
                this._configuration$)
            .switchMap<Node>(
                (nc: [Node, ICacheConfiguration]): Observable<Node> => {
                    let node: Node = nc[0];
                    let configuration: ICacheConfiguration = nc[1];

                    let depth: ICacheDepth = configuration.depth;

                    let sequenceDepth: number = Math.max(0, Math.min(4, depth.sequence));
                    let panoDepth: number = Math.max(0, Math.min(2, depth.pano));
                    let stepDepth: number = node.pano ? 0 : Math.max(0, Math.min(3, depth.step));
                    let turnDepth: number = node.pano ? 0 : Math.max(0, Math.min(1, depth.turn));

                    let next$: Observable<Node> = this._cache$(node, EdgeDirection.Next, sequenceDepth);
                    let prev$: Observable<Node> = this._cache$(node, EdgeDirection.Prev, sequenceDepth);

                    let pano$: Observable<Node> = this._cache$(node, EdgeDirection.Pano, panoDepth);

                    let forward$: Observable<Node> = this._cache$(node, EdgeDirection.StepForward, stepDepth);
                    let backward$: Observable<Node> = this._cache$(node, EdgeDirection.StepBackward, stepDepth);
                    let left$: Observable<Node> = this._cache$(node, EdgeDirection.StepLeft, stepDepth);
                    let right$: Observable<Node> = this._cache$(node, EdgeDirection.StepRight, stepDepth);

                    let turnLeft$: Observable<Node> = this._cache$(node, EdgeDirection.TurnLeft, turnDepth);
                    let turnRight$: Observable<Node> = this._cache$(node, EdgeDirection.TurnRight, turnDepth);
                    let turnU$: Observable<Node> = this._cache$(node, EdgeDirection.TurnU, turnDepth);

                    return Observable
                        .merge<Node>(
                            next$,
                            prev$,
                            forward$,
                            backward$,
                            left$,
                            right$,
                            pano$,
                            turnLeft$,
                            turnRight$,
                            turnU$)
                        .distinct(
                            (n1: Node, n2: Node): boolean => {
                                return n1.key === n2.key;
                            });
                })
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => { console.error(e); });
    }

    protected _deactivate(): void {
        this._cacheSubscription.unsubscribe();
    }

    private _cache$(node: Node, direction: EdgeDirection, depth: number): Observable<Node> {
        return Observable
            .of<NodeDepth>([node, depth])
            .expand(
                (nd: NodeDepth): Observable<NodeDepth> => {
                    let n: Node = nd[0];
                    let d: number = nd[1];

                    let nodes$: Observable<NodeDepth>[] = [];

                    if (d > 0) {
                        for (let edge of n.edges) {
                            if (edge.data.direction === direction) {
                                nodes$.push(
                                    Observable
                                        .zip<Node, number>(
                                            this._navigator.graphService.node$(edge.to),
                                            Observable.of<number>(d - 1)
                                ));
                            }
                        }
                    }

                    return Observable
                        .from<Observable<NodeDepth>>(nodes$)
                        .mergeAll();
                })
            .skip(1)
            .map<Node>((nd: NodeDepth): Node => { return nd[0]; });
    }
}

ComponentService.register(CacheComponent);
export default CacheComponent;
