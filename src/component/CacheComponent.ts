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

import {EdgeDirection, IEdge} from "../Edge";
import {IEdgeStatus, Node} from "../Graph";
import {ComponentService, Component, ICacheConfiguration, ICacheDepth} from "../Component";
import {Container, Navigator} from "../Viewer";

type NodeDepth = [Node, number];

type EdgesDepth = [IEdge[], number]

export class CacheComponent extends Component<ICacheConfiguration> {
    public static componentName: string = "cache";

    private _cacheSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
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
            .switchMap<EdgesDepth>(
                (nc: [Node, ICacheConfiguration]): Observable<EdgesDepth> => {
                    let node: Node = nc[0];
                    let configuration: ICacheConfiguration = nc[1];

                    let depth: ICacheDepth = configuration.depth;

                    let sequenceDepth: number = Math.max(0, Math.min(4, depth.sequence));
                    let panoDepth: number = Math.max(0, Math.min(2, depth.pano));
                    let stepDepth: number = node.pano ? 0 : Math.max(0, Math.min(3, depth.step));
                    let turnDepth: number = node.pano ? 0 : Math.max(0, Math.min(1, depth.turn));

                    let next$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.Next, sequenceDepth);
                    let prev$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.Prev, sequenceDepth);

                    let pano$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.Pano, panoDepth);

                    let forward$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.StepForward, stepDepth);
                    let backward$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.StepBackward, stepDepth);
                    let left$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.StepLeft, stepDepth);
                    let right$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.StepRight, stepDepth);

                    let turnLeft$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.TurnLeft, turnDepth);
                    let turnRight$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.TurnRight, turnDepth);
                    let turnU$: Observable<EdgesDepth> = this._cache$(node, EdgeDirection.TurnU, turnDepth);

                    return Observable
                        .merge<EdgesDepth>(
                            next$,
                            prev$,
                            forward$,
                            backward$,
                            left$,
                            right$,
                            pano$,
                            turnLeft$,
                            turnRight$,
                            turnU$);
                })
            .subscribe(
                (n: EdgesDepth): void => { return; },
                (e: Error): void => { console.error(e); });
    }

    protected _deactivate(): void {
        this._cacheSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): ICacheConfiguration {
        return { depth: { pano: 1, sequence: 2, step: 1, turn: 0 } };
    }

    private _cache$(node: Node, direction: EdgeDirection, depth: number): Observable<EdgesDepth> {
        return Observable
            .zip<EdgesDepth>(
                this._nodeToEdges$(node, direction),
                Observable.of<number>(depth))
            .expand(
                (ed: EdgesDepth): Observable<EdgesDepth> => {
                    let es: IEdge[] = ed[0];
                    let d: number = ed[1];

                    let edgesDepths$: Observable<EdgesDepth>[] = [];

                    if (d > 0) {
                        for (let edge of es) {
                            if (edge.data.direction === direction) {
                                edgesDepths$.push(
                                    Observable
                                        .zip<EdgesDepth>(
                                            this._navigator.graphService.cacheNode$(edge.to)
                                                .mergeMap(
                                                    (n: Node): Observable<IEdge[]> => {
                                                        return this._nodeToEdges$(n, direction);
                                                    }),
                                            Observable.of<number>(d - 1)
                                ));
                            }
                        }
                    }

                    return Observable
                        .from<Observable<EdgesDepth>>(edgesDepths$)
                        .mergeAll();
                })
            .skip(1);
    }

    private _nodeToEdges$(node: Node, direction: EdgeDirection): Observable<IEdge[]> {
       return ([EdgeDirection.Next, EdgeDirection.Prev].indexOf(direction) > -1 ?
            node.sequenceEdges$ :
            node.spatialEdges$)
                .first(
                    (status: IEdgeStatus): boolean => {
                        return status.cached;
                    })
                .map<IEdge[]>(
                    (status: IEdgeStatus): IEdge[] => {
                        return status.edges;
                    });
    }
}

ComponentService.register(CacheComponent);
export default CacheComponent;
