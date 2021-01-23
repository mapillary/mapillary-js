import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    from as observableFrom,
    merge as observableMerge,
    of as observableOf,
    zip as observableZip,
    Observable,
    Subscription,
} from "rxjs";

import {
    catchError,
    expand,
    filter,
    first,
    map,
    mergeAll,
    mergeMap,
    skip,
    switchMap,
} from "rxjs/operators";

import { Component } from "./Component";
import { ICacheConfiguration, ICacheDepth } from "./interfaces/ICacheConfiguration";

import { Node } from "../graph/Node";
import { IEdge } from "../graph/edge/interfaces/IEdge";
import { IEdgeStatus } from "../graph/interfaces/IEdgeStatus";
import { EdgeDirection } from "../graph/edge/EdgeDirection";
import { Container } from "../viewer/Container";
import { Navigator } from "../viewer/Navigator";

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
        this._sequenceSubscription = observableCombineLatest(
            this._navigator.stateService.currentNode$.pipe(
                switchMap(
                    (node: Node): Observable<IEdgeStatus> => {
                        return node.sequenceEdges$;
                    }),
                filter(
                    (status: IEdgeStatus): boolean => {
                        return status.cached;
                    })),
            this._configuration$).pipe(
                switchMap(
                    (nc: [IEdgeStatus, ICacheConfiguration]): Observable<EdgesDepth> => {
                        let status: IEdgeStatus = nc[0];
                        let configuration: ICacheConfiguration = nc[1];

                        let sequenceDepth: number = Math.max(0, Math.min(4, configuration.depth.sequence));

                        let next$: Observable<EdgesDepth> = this._cache$(status.edges, EdgeDirection.Next, sequenceDepth);
                        let prev$: Observable<EdgesDepth> = this._cache$(status.edges, EdgeDirection.Prev, sequenceDepth);

                        return observableMerge<EdgesDepth>(
                            next$,
                            prev$).pipe(
                                catchError(
                                    (error: Error): Observable<EdgesDepth> => {
                                        console.error("Failed to cache sequence edges.", error);

                                        return observableEmpty();
                                    }));
                    }))
            .subscribe(() => { /*noop*/ });

        this._spatialSubscription = observableCombineLatest(
            this._navigator.stateService.currentNode$.pipe(
                switchMap(
                    (node: Node): Observable<[Node, IEdgeStatus]> => {
                        return observableCombineLatest(
                            observableOf<Node>(node),
                            node.spatialEdges$.pipe(
                                filter(
                                    (status: IEdgeStatus): boolean => {
                                        return status.cached;
                                    })));
                    })),
            this._configuration$).pipe(
                switchMap(
                    ([[node, edgeStatus], configuration]: [[Node, IEdgeStatus], ICacheConfiguration]): Observable<EdgesDepth> => {
                        let edges: IEdge[] = edgeStatus.edges;
                        let depth: ICacheDepth = configuration.depth;

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

                        return observableMerge<EdgesDepth>(
                            forward$,
                            backward$,
                            left$,
                            right$,
                            pano$,
                            turnLeft$,
                            turnRight$,
                            turnU$).pipe(
                                catchError(
                                    (error: Error): Observable<EdgesDepth> => {
                                        console.error("Failed to cache spatial edges.", error);

                                        return observableEmpty();
                                    }));
                    }))
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
        return observableZip(
            observableOf<IEdge[]>(edges),
            observableOf<number>(depth)).pipe(
                expand(
                    (ed: EdgesDepth): Observable<EdgesDepth> => {
                        let es: IEdge[] = ed[0];
                        let d: number = ed[1];

                        let edgesDepths$: Observable<EdgesDepth>[] = [];

                        if (d > 0) {
                            for (let edge of es) {
                                if (edge.data.direction === direction) {
                                    edgesDepths$.push(
                                        observableZip(
                                            this._navigator.graphService.cacheNode$(edge.to).pipe(
                                                mergeMap(
                                                    (n: Node): Observable<IEdge[]> => {
                                                        return this._nodeToEdges$(n, direction);
                                                    })),
                                            observableOf<number>(d - 1)));
                                }
                            }
                        }

                        return observableFrom(edgesDepths$).pipe(
                            mergeAll());
                    }),
                skip(1));
    }

    private _nodeToEdges$(node: Node, direction: EdgeDirection): Observable<IEdge[]> {
        return ([EdgeDirection.Next, EdgeDirection.Prev].indexOf(direction) > -1 ?
            node.sequenceEdges$ :
            node.spatialEdges$).pipe(
                first(
                    (status: IEdgeStatus): boolean => {
                        return status.cached;
                    }),
                map(
                    (status: IEdgeStatus): IEdge[] => {
                        return status.edges;
                    }));
    }
}
