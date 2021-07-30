import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    from as observableFrom,
    merge as observableMerge,
    of as observableOf,
    zip as observableZip,
    Observable,
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

import { Component } from "../Component";
import {
    CacheConfiguration,
    CacheDepthConfiguration,
} from "../interfaces/CacheConfiguration";

import { Image } from "../../graph/Image";
import { NavigationEdge } from "../../graph/edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus }
    from "../../graph/interfaces/NavigationEdgeStatus";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { isSpherical } from "../../geo/Geo";
import { ComponentName } from "../ComponentName";

type EdgesDepth = [NavigationEdge[], number];

export class CacheComponent extends Component<CacheConfiguration> {
    public static componentName: ComponentName = "cache";

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        subs.push(observableCombineLatest(
            this._navigator.stateService.currentImage$.pipe(
                switchMap(
                    (image: Image): Observable<NavigationEdgeStatus> => {
                        return image.sequenceEdges$;
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

                        return observableMerge(
                            next$,
                            prev$).pipe(
                                catchError(
                                    (error: Error): Observable<EdgesDepth> => {
                                        console.error("Failed to cache sequence edges.", error);

                                        return observableEmpty();
                                    }));
                    }))
            .subscribe(() => { /*noop*/ }));

        subs.push(observableCombineLatest(
            this._navigator.stateService.currentImage$.pipe(
                switchMap(
                    (image: Image): Observable<[Image, NavigationEdgeStatus]> => {
                        return observableCombineLatest(
                            observableOf<Image>(image),
                            image.spatialEdges$.pipe(
                                filter(
                                    (status: NavigationEdgeStatus): boolean => {
                                        return status.cached;
                                    })));
                    })),
            this._configuration$).pipe(
                switchMap(
                    ([[image, edgeStatus], configuration]: [[Image, NavigationEdgeStatus], CacheConfiguration]): Observable<EdgesDepth> => {
                        let edges: NavigationEdge[] = edgeStatus.edges;
                        let depth: CacheDepthConfiguration = configuration.depth;

                        let sphericalDepth =
                            Math.max(0, Math.min(2, depth.spherical));
                        let stepDepth = isSpherical(image.cameraType) ?
                            0 : Math.max(0, Math.min(3, depth.step));
                        let turnDepth = isSpherical(image.cameraType) ?
                            0 : Math.max(0, Math.min(1, depth.turn));

                        let spherical$ = this._cache$(edges, NavigationDirection.Spherical, sphericalDepth);

                        let forward$ = this._cache$(edges, NavigationDirection.StepForward, stepDepth);
                        let backward$ = this._cache$(edges, NavigationDirection.StepBackward, stepDepth);
                        let left$ = this._cache$(edges, NavigationDirection.StepLeft, stepDepth);
                        let right$ = this._cache$(edges, NavigationDirection.StepRight, stepDepth);

                        let turnLeft$ = this._cache$(edges, NavigationDirection.TurnLeft, turnDepth);
                        let turnRight$ = this._cache$(edges, NavigationDirection.TurnRight, turnDepth);
                        let turnU$ = this._cache$(edges, NavigationDirection.TurnU, turnDepth);

                        return observableMerge(
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
            .subscribe(() => { /*noop*/ }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): CacheConfiguration {
        return { depth: { spherical: 1, sequence: 2, step: 1, turn: 0 } };
    }

    private _cache$(
        edges: NavigationEdge[],
        direction: NavigationDirection,
        depth: number)
        : Observable<EdgesDepth> {
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
                                            this._navigator.graphService.cacheImage$(edge.target).pipe(
                                                mergeMap(
                                                    (n: Image): Observable<NavigationEdge[]> => {
                                                        return this._imageToEdges$(n, direction);
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

    private _imageToEdges$(image: Image, direction: NavigationDirection): Observable<NavigationEdge[]> {
        return ([NavigationDirection.Next, NavigationDirection.Prev].indexOf(direction) > -1 ?
            image.sequenceEdges$ :
            image.spatialEdges$).pipe(
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
