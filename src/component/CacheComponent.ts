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
import { CacheConfiguration, CacheDepthConfiguration } from "./interfaces/CacheConfiguration";

import { Node } from "../graph/Node";
import { NavigationEdge } from "../graph/edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus } from "../graph/interfaces/NavigationEdgeStatus";
import { NavigationDirection } from "../graph/edge/NavigationDirection";
import { Container } from "../viewer/Container";
import { Navigator } from "../viewer/Navigator";
import { isSpherical } from "../geo/Geo";

type EdgesDepth = [NavigationEdge[], number];

export class CacheComponent extends Component<CacheConfiguration> {
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
     * @param {CacheDepthConfiguration} depth - Cache depth structure.
     */
    public setDepth(depth: CacheDepthConfiguration): void {
        this.configure({ depth: depth });
    }

    protected _activate(): void {
        this._sequenceSubscription = observableCombineLatest(
            this._navigator.stateService.currentNode$.pipe(
                switchMap(
                    (node: Node): Observable<NavigationEdgeStatus> => {
                        return node.sequenceEdges$;
                    }),
                filter(
                    (status: NavigationEdgeStatus): boolean => {
                        return status.cached;
                    })),
            this._configuration$).pipe(
                switchMap(
                    (nc: [NavigationEdgeStatus, CacheConfiguration]): Observable<EdgesDepth> => {
                        let status: NavigationEdgeStatus = nc[0];
                        let configuration: CacheConfiguration = nc[1];

                        let sequenceDepth = Math.max(0, Math.min(4, configuration.depth.sequence));

                        let next$ = this._cache$(status.edges, NavigationDirection.Next, sequenceDepth);
                        let prev$ = this._cache$(status.edges, NavigationDirection.Prev, sequenceDepth);

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
                    (node: Node): Observable<[Node, NavigationEdgeStatus]> => {
                        return observableCombineLatest(
                            observableOf<Node>(node),
                            node.spatialEdges$.pipe(
                                filter(
                                    (status: NavigationEdgeStatus): boolean => {
                                        return status.cached;
                                    })));
                    })),
            this._configuration$).pipe(
                switchMap(
                    ([[node, edgeStatus], configuration]: [[Node, NavigationEdgeStatus], CacheConfiguration]): Observable<EdgesDepth> => {
                        let edges: NavigationEdge[] = edgeStatus.edges;
                        let depth: CacheDepthConfiguration = configuration.depth;

                        let sphericalDepth =
                            Math.max(0, Math.min(2, depth.spherical));
                        let stepDepth = isSpherical(node.cameraType) ?
                            0 : Math.max(0, Math.min(3, depth.step));
                        let turnDepth = isSpherical(node.cameraType) ?
                            0 : Math.max(0, Math.min(1, depth.turn));

                        let spherical$ = this._cache$(edges, NavigationDirection.Spherical, sphericalDepth);

                        let forward$ = this._cache$(edges, NavigationDirection.StepForward, stepDepth);
                        let backward$ = this._cache$(edges, NavigationDirection.StepBackward, stepDepth);
                        let left$ = this._cache$(edges, NavigationDirection.StepLeft, stepDepth);
                        let right$ = this._cache$(edges, NavigationDirection.StepRight, stepDepth);

                        let turnLeft$ = this._cache$(edges, NavigationDirection.TurnLeft, turnDepth);
                        let turnRight$ = this._cache$(edges, NavigationDirection.TurnRight, turnDepth);
                        let turnU$ = this._cache$(edges, NavigationDirection.TurnU, turnDepth);

                        return observableMerge<EdgesDepth>(
                            forward$,
                            backward$,
                            left$,
                            right$,
                            spherical$,
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

    protected _getDefaultConfiguration(): CacheConfiguration {
        return { depth: { spherical: 1, sequence: 2, step: 1, turn: 0 } };
    }

    private _cache$(edges: NavigationEdge[], direction: NavigationDirection, depth: number): Observable<EdgesDepth> {
        return observableZip(
            observableOf<NavigationEdge[]>(edges),
            observableOf<number>(depth)).pipe(
                expand(
                    (ed: EdgesDepth): Observable<EdgesDepth> => {
                        let es: NavigationEdge[] = ed[0];
                        let d = ed[1];

                        let edgesDepths$: Observable<EdgesDepth>[] = [];

                        if (d > 0) {
                            for (let edge of es) {
                                if (edge.data.direction === direction) {
                                    edgesDepths$.push(
                                        observableZip(
                                            this._navigator.graphService.cacheNode$(edge.target).pipe(
                                                mergeMap(
                                                    (n: Node): Observable<NavigationEdge[]> => {
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

    private _nodeToEdges$(node: Node, direction: NavigationDirection): Observable<NavigationEdge[]> {
        return ([NavigationDirection.Next, NavigationDirection.Prev].indexOf(direction) > -1 ?
            node.sequenceEdges$ :
            node.spatialEdges$).pipe(
                first(
                    (status: NavigationEdgeStatus): boolean => {
                        return status.cached;
                    }),
                map(
                    (status: NavigationEdgeStatus): NavigationEdge[] => {
                        return status.edges;
                    }));
    }
}
