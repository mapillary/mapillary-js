import {
    from as observableFrom,
    throwError as observableThrowError,
    BehaviorSubject,
    Observable,
    ReplaySubject,
    Subscription,
} from "rxjs";

import {
    finalize,
    first,
    last,
    map,
    mergeAll,
    mergeMap,
    tap,
} from "rxjs/operators";

import { CacheService } from "./CacheService";
import { LoadingService } from "./LoadingService";
import { PanService } from "./PanService";
import { PlayService } from "./PlayService";
import { ViewerOptions } from "./interfaces/ViewerOptions";

import { APIWrapper } from "../api/APIWrapper";
import { DataProviderBase } from "../api/DataProviderBase";
import { FalcorDataProvider } from "../api/falcor/FalcorDataProvider";
import { AbortMapillaryError } from "../error/AbortMapillaryError";
import { FilterExpression } from "../graph/FilterExpression";
import { Graph } from "../graph/Graph";
import { GraphService } from "../graph/GraphService";
import { Node } from "../graph/Node";
import { NavigationDirection } from "../graph/edge/NavigationDirection";
import { NavigationEdgeStatus } from "../graph/interfaces/NavigationEdgeStatus";
import { StateService } from "../state/StateService";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";

export class Navigator {
    private _api: APIWrapper;

    private _cacheService: CacheService;
    private _graphService: GraphService;
    private _loadingService: LoadingService;
    private _loadingName: string;
    private _panService: PanService;
    private _playService: PlayService;
    private _stateService: StateService;

    private _idRequested$: BehaviorSubject<string>;
    private _movedToId$: BehaviorSubject<string>;

    private _request$: ReplaySubject<Node>;
    private _requestSubscription: Subscription;
    private _nodeRequestSubscription: Subscription;

    constructor(
        options: ViewerOptions,
        api?: APIWrapper,
        graphService?: GraphService,
        loadingService?: LoadingService,
        stateService?: StateService,
        cacheService?: CacheService,
        playService?: PlayService,
        panService?: PanService) {

        if (!!api) {
            this._api = api;
        } else if (typeof options.apiClient === 'string') {
            this._api = new APIWrapper(new FalcorDataProvider({
                clientToken: options.apiClient,
                userToken: options.userToken,
            }));
        } else if (options.apiClient instanceof DataProviderBase) {
            this._api = new APIWrapper(options.apiClient);
        } else {
            throw new Error(`Invalid type: 'apiClient' must be a String or an object instance extending the DataProvderBase class.`);
        }

        this._graphService = graphService != null ?
            graphService :
            new GraphService(new Graph(this.api));

        this._loadingService = loadingService != null ? loadingService : new LoadingService();
        this._loadingName = "navigator";

        this._stateService = stateService != null ? stateService : new StateService(options.transitionMode);

        this._cacheService = cacheService != null ?
            cacheService :
            new CacheService(this._graphService, this._stateService);

        this._playService = playService != null ?
            playService :
            new PlayService(this._graphService, this._stateService);

        this._panService = panService != null ?
            panService :
            new PanService(this._graphService, this._stateService, options.combinedPanning);

        this._idRequested$ = new BehaviorSubject<string>(null);
        this._movedToId$ = new BehaviorSubject<string>(null);

        this._request$ = null;
        this._requestSubscription = null;
        this._nodeRequestSubscription = null;
    }

    public get api(): APIWrapper {
        return this._api;
    }

    public get cacheService(): CacheService {
        return this._cacheService;
    }

    public get graphService(): GraphService {
        return this._graphService;
    }

    public get loadingService(): LoadingService {
        return this._loadingService;
    }

    public get movedToId$(): Observable<string> {
        return this._movedToId$;
    }

    public get panService(): PanService {
        return this._panService;
    }

    public get playService(): PlayService {
        return this._playService;
    }

    public get stateService(): StateService {
        return this._stateService;
    }

    public dispose(): void {
        this._abortRequest("viewer removed");

        this._cacheService.stop();
        this._graphService.dispose();
        this._panService.dispose();
        this._playService.dispose();
        this._stateService.dispose();
    }

    public moveTo$(id: string): Observable<Node> {
        this._abortRequest(`to id ${id}`);

        this._loadingService.startLoading(this._loadingName);

        const node$: Observable<Node> = this._moveTo$(id);

        return this._makeRequest$(node$);
    }

    public moveDir$(direction: NavigationDirection): Observable<Node> {
        this._abortRequest(`in dir ${NavigationDirection[direction]}`);

        this._loadingService.startLoading(this._loadingName);

        const node$: Observable<Node> = this.stateService.currentNode$.pipe(
            first(),
            mergeMap(
                (node: Node): Observable<string> => {
                    return ([NavigationDirection.Next, NavigationDirection.Prev].indexOf(direction) > -1 ?
                        node.sequenceEdges$ :
                        node.spatialEdges$).pipe(
                            first(),
                            map(
                                (status: NavigationEdgeStatus): string => {
                                    for (let edge of status.edges) {
                                        if (edge.data.direction === direction) {
                                            return edge.target;
                                        }
                                    }

                                    return null;
                                }));
                }),
            mergeMap(
                (directionId: string) => {
                    if (directionId == null) {
                        this._loadingService.stopLoading(this._loadingName);

                        return observableThrowError(new Error(`Direction (${direction}) does not exist for current node.`));
                    }

                    return this._moveTo$(directionId);
                }));

        return this._makeRequest$(node$);
    }

    public setFilter$(filter: FilterExpression): Observable<void> {
        this._stateService.clearNodes();

        return this._movedToId$.pipe(
            first(),
            mergeMap(
                (id: string): Observable<Node> => {
                    if (id != null) {
                        return this._trajectoryIds$().pipe(
                            mergeMap(
                                (ids: string[]): Observable<Node> => {
                                    return this._graphService.setFilter$(filter).pipe(
                                        mergeMap(
                                            (): Observable<Node> => {
                                                return this._cacheIds$(ids);
                                            }));
                                }),
                            last());
                    }

                    return this._idRequested$.pipe(
                        first(),
                        mergeMap(
                            (requestedId: string): Observable<Node> => {
                                if (requestedId != null) {
                                    return this._graphService.setFilter$(filter).pipe(
                                        mergeMap(
                                            (): Observable<Node> => {
                                                return this._graphService.cacheNode$(requestedId);
                                            }));
                                }

                                return this._graphService.setFilter$(filter).pipe(
                                    map(
                                        (): Node => {
                                            return undefined;
                                        }));
                            }));
                }),
            map(
                (): void => {
                    return undefined;
                }));
    }

    public setUserToken$(userToken?: string): Observable<void> {
        this._abortRequest("to set user token");

        this._stateService.clearNodes();

        return this._movedToId$.pipe(
            first(),
            tap(
                (): void => {
                    this._api.setUserToken(userToken);
                }),
            mergeMap(
                (id: string): Observable<void> => {
                    return id == null ?
                        this._graphService.reset$([]) :
                        this._trajectoryIds$().pipe(
                            mergeMap(
                                (ids: string[]): Observable<Node> => {
                                    return this._graphService.reset$(ids).pipe(
                                        mergeMap(
                                            (): Observable<Node> => {
                                                return this._cacheIds$(ids);
                                            }));
                                }),
                            last(),
                            map(
                                (): void => {
                                    return undefined;
                                }));
                }));
    }

    private _cacheIds$(ids: string[]): Observable<Node> {
        let cacheNodes$: Observable<Node>[] = ids
            .map(
                (id: string): Observable<Node> => {
                    return this._graphService.cacheNode$(id);
                });

        return observableFrom(cacheNodes$).pipe(
            mergeAll());
    }

    private _abortRequest(reason: string): void {
        if (this._requestSubscription != null) {
            this._requestSubscription.unsubscribe();
            this._requestSubscription = null;
        }

        if (this._nodeRequestSubscription != null) {
            this._nodeRequestSubscription.unsubscribe();
            this._nodeRequestSubscription = null;
        }

        if (this._request$ != null) {
            if (!(this._request$.isStopped || this._request$.hasError)) {
                this._request$.error(new AbortMapillaryError(`Request aborted by a subsequent request ${reason}.`));
            }

            this._request$ = null;
        }
    }

    private _makeRequest$(node$: Observable<Node>): Observable<Node> {
        const request$: ReplaySubject<Node> = new ReplaySubject<Node>(1);
        this._requestSubscription = request$
            .subscribe(undefined, (): void => { /*noop*/ });

        this._request$ = request$;

        this._nodeRequestSubscription = node$
            .subscribe(
                (node: Node): void => {
                    this._request$ = null;

                    request$.next(node);
                    request$.complete();
                },
                (error: Error): void => {
                    this._request$ = null;

                    request$.error(error);
                });

        return request$;
    }

    private _moveTo$(id: string): Observable<Node> {
        this._idRequested$.next(id);

        return this._graphService.cacheNode$(id).pipe(
            tap(
                (node: Node) => {
                    this._stateService.setNodes([node]);
                    this._movedToId$.next(node.id);
                }),
            finalize(
                (): void => {
                    this._loadingService.stopLoading(this._loadingName);
                }));
    }

    private _trajectoryIds$(): Observable<string[]> {
        return this._stateService.currentState$.pipe(
            first(),
            map(
                (frame: AnimationFrame): string[] => {
                    return frame.state.trajectory
                        .map(
                            (node: Node): string => {
                                return node.id;
                            });
                }));
    }
}
