import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {EdgeDirection, IEdge} from "../Edge";
import {IEdgeStatus, Node} from "../Graph";
import {ComponentService, Component, ICacheConfiguration, ICacheDepth} from "../Component";
import {Container, Navigator} from "../Viewer";

type EdgesDepth = [IEdge[], number];

export class CacheComponent extends Component<ICacheConfiguration> {
    public static componentName: string = "cache";

    private _sequenceSubscription: Subscription;
    private _spatialSubscription: Subscription;

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
        this._sequenceSubscription = Observable
            .combineLatest(
                this._navigator.stateService.currentNode$
                    .switchMap(
                        (node: Node): Observable<IEdgeStatus> => {
                            return node.sequenceEdges$;
                        })
                    .filter(
                        (status: IEdgeStatus): boolean => {
                            return status.cached;
                        }),
                this._configuration$)
            .switchMap(
                (nc: [IEdgeStatus, ICacheConfiguration]): Observable<EdgesDepth> => {
                    let status: IEdgeStatus = nc[0];
                    let configuration: ICacheConfiguration = nc[1];

                    let sequenceDepth: number = Math.max(0, Math.min(4, configuration.depth.sequence));

                    let next$: Observable<EdgesDepth> = this._cache$(status.edges, EdgeDirection.Next, sequenceDepth);
                    let prev$: Observable<EdgesDepth> = this._cache$(status.edges, EdgeDirection.Prev, sequenceDepth);

                    return Observable
                        .merge<EdgesDepth>(
                            next$,
                            prev$)
                        .catch(
                            (error: Error, caught: Observable<EdgesDepth>): Observable<EdgesDepth> => {
                                console.error("Failed to cache sequence edges.", error);

                                return Observable.empty<EdgesDepth>();
                            });
                 })
            .subscribe(() => { /*noop*/ });

        this._spatialSubscription = this._navigator.stateService.currentNode$
                .switchMap(
                    (node: Node): Observable<[Node, IEdgeStatus]> => {
                        return Observable
                            .combineLatest(
                                Observable.of<Node>(node),
                                node.spatialEdges$
                                    .filter(
                                        (status: IEdgeStatus): boolean => {
                                            return status.cached;
                                        }));
                    })
                .combineLatest(
                    this._configuration$,
                    (ns: [Node, IEdgeStatus], configuration: ICacheConfiguration):
                        [Node, IEdgeStatus, ICacheConfiguration] => {
                            return [ns[0], ns[1], configuration];
                        })
            .switchMap(
                (args: [Node, IEdgeStatus, ICacheConfiguration]): Observable<EdgesDepth> => {
                    let node: Node = args[0];
                    let edges: IEdge[] = args[1].edges;
                    let depth: ICacheDepth = args[2].depth;

                    let panoDepth: number = Math.max(0, Math.min(2, depth.pano));
                    let stepDepth: number = node.pano ? 0 : Math.max(0, Math.min(3, depth.step));
                    let turnDepth: number = node.pano ? 0 : Math.max(0, Math.min(1, depth.turn));

                    let pano$: Observable<EdgesDepth> = this._cache$(edges, EdgeDirection.Pano, panoDepth);

                    let forward$: Observable<EdgesDepth> = this._cache$(edges, EdgeDirection.StepForward, stepDepth);
                    let backward$: Observable<EdgesDepth> = this._cache$(edges, EdgeDirection.StepBackward, stepDepth);
                    let left$: Observable<EdgesDepth> = this._cache$(edges, EdgeDirection.StepLeft, stepDepth);
                    let right$: Observable<EdgesDepth> = this._cache$(edges, EdgeDirection.StepRight, stepDepth);

                    let turnLeft$: Observable<EdgesDepth> = this._cache$(edges, EdgeDirection.TurnLeft, turnDepth);
                    let turnRight$: Observable<EdgesDepth> = this._cache$(edges, EdgeDirection.TurnRight, turnDepth);
                    let turnU$: Observable<EdgesDepth> = this._cache$(edges, EdgeDirection.TurnU, turnDepth);

                    return Observable
                        .merge<EdgesDepth>(
                            forward$,
                            backward$,
                            left$,
                            right$,
                            pano$,
                            turnLeft$,
                            turnRight$,
                            turnU$)
                        .catch(
                            (error: Error, caught: Observable<EdgesDepth>): Observable<EdgesDepth> => {
                                console.error("Failed to cache spatial edges.", error);

                                return Observable.empty<EdgesDepth>();
                            });
                })
            .subscribe(() => { /*noop*/ });
    }

    protected _deactivate(): void {
        this._sequenceSubscription.unsubscribe();
        this._spatialSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): ICacheConfiguration {
        return { depth: { pano: 1, sequence: 2, step: 1, turn: 0 } };
    }

    private _cache$(edges: IEdge[], direction: EdgeDirection, depth: number): Observable<EdgesDepth> {
        return Observable
            .zip(
                Observable.of<IEdge[]>(edges),
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
                                        .zip(
                                            this._navigator.graphService.cacheNode$(edge.to)
                                                .mergeMap(
                                                    (n: Node): Observable<IEdge[]> => {
                                                        return this._nodeToEdges$(n, direction);
                                                    }),
                                            Observable.of<number>(d - 1)));
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
                .map(
                    (status: IEdgeStatus): IEdge[] => {
                        return status.edges;
                    });
    }
}

ComponentService.register(CacheComponent);
export default CacheComponent;
