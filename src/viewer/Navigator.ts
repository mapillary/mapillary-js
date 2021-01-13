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

import {
    FilterExpression,
    Graph,
    GraphService,
    IEdgeStatus,
    Node,
} from "../Graph";
import { EdgeDirection } from "../Edge";
import { AbortMapillaryError } from "../Error";
import {
    StateService,
    IFrame,
} from "../State";
import {
    CacheService,
    IViewerOptions,
    LoadingService,
    PlayService,
} from "../Viewer";
import PanService from "./PanService";
import API from "../api/API";
import FalcorDataProvider from "../api/FalcorDataProvider";
import DataProviderBase from "../api/DataProviderBase";

export class Navigator {
    private _api: API;

    private _cacheService: CacheService;
    private _graphService: GraphService;
    private _loadingService: LoadingService;
    private _loadingName: string;
    private _panService: PanService;
    private _playService: PlayService;
    private _stateService: StateService;

    private _keyRequested$: BehaviorSubject<string>;
    private _movedToKey$: BehaviorSubject<string>;

    private _request$: ReplaySubject<Node>;
    private _requestSubscription: Subscription;
    private _nodeRequestSubscription: Subscription;

    constructor(
        options: IViewerOptions,
        api?: API,
        graphService?: GraphService,
        loadingService?: LoadingService,
        stateService?: StateService,
        cacheService?: CacheService,
        playService?: PlayService,
        panService?: PanService) {

        if (!!api) {
            this._api = api;
        } else if (typeof options.apiClient === 'string') {
            this._api = new API(new FalcorDataProvider({
                clientToken: options.apiClient,
                userToken: options.userToken,
            }));
        } else if (options.apiClient instanceof DataProviderBase) {
            this._api = new API(options.apiClient);
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

        this._keyRequested$ = new BehaviorSubject<string>(null);
        this._movedToKey$ = new BehaviorSubject<string>(null);

        this._request$ = null;
        this._requestSubscription = null;
        this._nodeRequestSubscription = null;
    }

    public get api(): API {
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

    public get movedToKey$(): Observable<string> {
        return this._movedToKey$;
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

    public moveToKey$(key: string): Observable<Node> {
        this._abortRequest(`to key ${key}`);

        this._loadingService.startLoading(this._loadingName);

        const node$: Observable<Node> = this._moveToKey$(key);

        return this._makeRequest$(node$);
    }

    public moveDir$(direction: EdgeDirection): Observable<Node> {
        this._abortRequest(`in dir ${EdgeDirection[direction]}`);

        this._loadingService.startLoading(this._loadingName);

        const node$: Observable<Node> = this.stateService.currentNode$.pipe(
            first(),
            mergeMap(
                (node: Node): Observable<string> => {
                    return ([EdgeDirection.Next, EdgeDirection.Prev].indexOf(direction) > -1 ?
                        node.sequenceEdges$ :
                        node.spatialEdges$).pipe(
                            first(),
                            map(
                                (status: IEdgeStatus): string => {
                                    for (let edge of status.edges) {
                                        if (edge.data.direction === direction) {
                                            return edge.to;
                                        }
                                    }

                                    return null;
                                }));
                }),
            mergeMap(
                (directionKey: string) => {
                    if (directionKey == null) {
                        this._loadingService.stopLoading(this._loadingName);

                        return observableThrowError(new Error(`Direction (${direction}) does not exist for current node.`));
                    }

                    return this._moveToKey$(directionKey);
                }));

        return this._makeRequest$(node$);
    }

    public setFilter$(filter: FilterExpression): Observable<void> {
        this._stateService.clearNodes();

        return this._movedToKey$.pipe(
            first(),
            mergeMap(
                (key: string): Observable<Node> => {
                    if (key != null) {
                        return this._trajectoryKeys$().pipe(
                            mergeMap(
                                (keys: string[]): Observable<Node> => {
                                    return this._graphService.setFilter$(filter).pipe(
                                        mergeMap(
                                            (): Observable<Node> => {
                                                return this._cacheKeys$(keys);
                                            }));
                                }),
                            last());
                    }

                    return this._keyRequested$.pipe(
                        first(),
                        mergeMap(
                            (requestedKey: string): Observable<Node> => {
                                if (requestedKey != null) {
                                    return this._graphService.setFilter$(filter).pipe(
                                        mergeMap(
                                            (): Observable<Node> => {
                                                return this._graphService.cacheNode$(requestedKey);
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

        return this._movedToKey$.pipe(
            first(),
            tap(
                (): void => {
                    this._api.setUserToken(userToken);
                }),
            mergeMap(
                (key: string): Observable<void> => {
                    return key == null ?
                        this._graphService.reset$([]) :
                        this._trajectoryKeys$().pipe(
                            mergeMap(
                                (keys: string[]): Observable<Node> => {
                                    return this._graphService.reset$(keys).pipe(
                                        mergeMap(
                                            (): Observable<Node> => {
                                                return this._cacheKeys$(keys);
                                            }));
                                }),
                            last(),
                            map(
                                (): void => {
                                    return undefined;
                                }));
                }));
    }

    private _cacheKeys$(keys: string[]): Observable<Node> {
        let cacheNodes$: Observable<Node>[] = keys
            .map(
                (key: string): Observable<Node> => {
                    return this._graphService.cacheNode$(key);
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

    private _moveToKey$(key: string): Observable<Node> {
        this._keyRequested$.next(key);

        return this._graphService.cacheNode$(key).pipe(
            tap(
                (node: Node) => {
                    this._stateService.setNodes([node]);
                    this._movedToKey$.next(node.key);
                }),
            finalize(
                (): void => {
                    this._loadingService.stopLoading(this._loadingName);
                }));
    }

    private _trajectoryKeys$(): Observable<string[]> {
        return this._stateService.currentState$.pipe(
            first(),
            map(
                (frame: IFrame): string[] => {
                    return frame.state.trajectory
                        .map(
                            (node: Node): string => {
                                return node.key;
                            });
                }));
    }
}

export default Navigator;
