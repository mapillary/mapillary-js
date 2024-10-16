import {
    from as observableFrom,
    of as observableOf,
    throwError as observableThrowError,
    BehaviorSubject,
    Observable,
    ReplaySubject,
    Subscription,
} from "rxjs";

import {
    filter as observableFilter,
    finalize,
    first,
    last,
    map,
    mergeAll,
    mergeMap,
    takeLast,
    tap,
} from "rxjs/operators";

import { CacheService } from "./CacheService";
import { LoadingService } from "./LoadingService";
import { PanService } from "./PanService";
import { PlayService } from "./PlayService";
import { ViewerOptions } from "./options/ViewerOptions";

import { APIWrapper } from "../api/APIWrapper";
import { CancelMapillaryError } from "../error/CancelMapillaryError";
import { FilterExpression } from "../graph/FilterExpression";
import { Graph } from "../graph/Graph";
import { GraphService } from "../graph/GraphService";
import { Image } from "../graph/Image";
import { NavigationDirection } from "../graph/edge/NavigationDirection";
import { NavigationEdgeStatus } from "../graph/interfaces/NavigationEdgeStatus";
import { StateService } from "../state/StateService";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { cameraControlsToState } from "./Modes";
import { CameraControls } from "./enums/CameraControls";
import { GraphDataProvider } from "../api/provider/GraphDataProvider";
import { ProjectionService } from "./ProjectionService";
import { isNullImageId, makeNullImage$ } from "../util/Common";

export class Navigator {
    private _api: APIWrapper;

    private _cacheService: CacheService;
    private _graphService: GraphService;
    private _loadingService: LoadingService;
    private _loadingName: string;
    private _panService: PanService;
    private _playService: PlayService;
    private _projectionService: ProjectionService;
    private _stateService: StateService;


    private _idRequested$: BehaviorSubject<string>;
    private _movedToId$: BehaviorSubject<string>;

    private _request$: ReplaySubject<Image>;
    private _requestSubscription: Subscription;
    private _imageRequestSubscription: Subscription;

    constructor(
        options: ViewerOptions,
        api?: APIWrapper,
        graphService?: GraphService,
        loadingService?: LoadingService,
        stateService?: StateService,
        cacheService?: CacheService,
        playService?: PlayService,
        panService?: PanService) {

        if (api) {
            this._api = api;
        } else if (options.dataProvider) {
            this._api = new APIWrapper(options.dataProvider);
        } else {
            this._api = new APIWrapper(new GraphDataProvider({
                accessToken: options.accessToken,
            }));
        }

        this._projectionService = new ProjectionService();

        this._graphService = graphService ??
            new GraphService(new Graph(this.api, options), this._projectionService);

        this._loadingName = "navigator";
        this._loadingService = loadingService ??
            new LoadingService();

        const cameraControls = options.cameraControls ?? CameraControls.Street;
        this._stateService = stateService ??
            new StateService(
                cameraControlsToState(cameraControls),
                this._api.data.geometry,
                options.transitionMode);

        this._cacheService = cacheService ??
            new CacheService(
                this._graphService,
                this._stateService,
                this._api);

        this._playService = playService ??
            new PlayService(this._graphService, this._stateService);

        this._panService = panService ??
            new PanService(
                this._graphService,
                this._stateService,
                this._projectionService,
                options.combinedPanning);

        this._idRequested$ = new BehaviorSubject<string>(null);
        this._movedToId$ = new BehaviorSubject<string>(null);

        this._request$ = null;
        this._requestSubscription = null;
        this._imageRequestSubscription = null;
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

    public get projectionService(): ProjectionService {
        return this._projectionService;
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

    public moveDir$(direction: NavigationDirection): Observable<Image> {
        this._abortRequest(`in dir ${NavigationDirection[direction]}`);

        this._loadingService.startLoading(this._loadingName);

        const image$ = this.stateService.currentImage$.pipe(
            first(),
            mergeMap(
                (image: Image): Observable<string> => {
                    return ([NavigationDirection.Next, NavigationDirection.Prev].indexOf(direction) > -1 ?
                        image.sequenceEdges$ :
                        image.spatialEdges$).pipe(
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

                        return observableThrowError(new Error(`Direction (${direction}) does not exist for current image.`));
                    }

                    return this._moveTo$(directionId);
                }));

        return this._makeRequest$(image$);
    }

    public moveTo$(id: string): Observable<Image> {
        this._abortRequest(`to id ${id}`);

        this._loadingService.startLoading(this._loadingName);

        const image$ = this._moveTo$(id);
        return this._makeRequest$(image$);
    }

    public reset$(): Observable<void> {
        this._abortRequest("to reset");

        return this._reset$()
            .pipe(map(() => undefined));
    }

    public setFilter$(filter: FilterExpression): Observable<void> {
        this._stateService.clearImages();

        return this._movedToId$.pipe(
            first(),
            mergeMap(
                (id: string): Observable<Image> => {
                    if (id != null) {
                        return this._trajectoryIds$().pipe(
                            mergeMap(
                                (ids: string[]): Observable<Image> => {
                                    return this._graphService.setFilter$(filter).pipe(
                                        mergeMap(
                                            (): Observable<Image> => {
                                                return this._cacheIds$(ids);
                                            }));
                                }),
                            takeLast(1));
                    }

                    return this._idRequested$.pipe(
                        first(),
                        mergeMap(
                            (requestedId: string): Observable<Image> => {
                                if (requestedId != null) {
                                    return this._graphService.setFilter$(filter).pipe(
                                        mergeMap(
                                            (): Observable<Image> => {
                                                return this._graphService.cacheImage$(requestedId);
                                            }));
                                }

                                return this._graphService.setFilter$(filter).pipe(
                                    map(
                                        (): Image => {
                                            return undefined;
                                        }));
                            }));
                }),
            map(
                (): void => {
                    return undefined;
                }));
    }

    public setAccessToken$(accessToken?: string): Observable<void> {
        this._abortRequest("to set user token");

        return this._reset$(() => this._api.setAccessToken(accessToken));
    }

    private _cacheIds$(ids: string[]): Observable<Image> {
        const cacheImages$ = ids
            .map(
                (id: string): Observable<Image> => {
                    return this._graphService.hasImage$(id).pipe(
                        observableFilter((exists: boolean): boolean => {
                            return exists;
                        }),
                        mergeMap((): Observable<Image> => {
                            return this._graphService.cacheImage$(id);
                        }));
                });

        return observableFrom(cacheImages$).pipe(
            mergeAll());
    }

    private _abortRequest(reason: string): void {
        if (this._requestSubscription != null) {
            this._requestSubscription.unsubscribe();
            this._requestSubscription = null;
        }

        if (this._imageRequestSubscription != null) {
            this._imageRequestSubscription.unsubscribe();
            this._imageRequestSubscription = null;
        }

        this._idRequested$.next(null);

        if (this._request$ != null) {
            if (!(this._request$.isStopped || this._request$.hasError)) {
                this._request$.error(new CancelMapillaryError(`Request aborted by a subsequent request ${reason}.`));
            }

            this._request$ = null;
        }
    }

    private _makeRequest$(image$: Observable<Image>): Observable<Image> {
        const request$: ReplaySubject<Image> = new ReplaySubject<Image>(1);
        this._requestSubscription = request$
            .subscribe(undefined, (): void => { /*noop*/ });

        this._request$ = request$;

        this._imageRequestSubscription = image$
            .subscribe(
                (image: Image): void => {
                    this._request$ = null;

                    request$.next(image);
                    request$.complete();
                },
                (error: Error): void => {
                    this._request$ = null;

                    request$.error(error);
                });

        return request$;
    }

    private _moveTo$(id: string): Observable<Image> {
        this._idRequested$.next(id);

        return this._graphService.cacheImage$(id).pipe(
            tap(
                (image: Image) => {
                    this._stateService.setImages([image]);
                    this._movedToId$.next(image.id);
                }),
            finalize(
                (): void => {
                    this._loadingService.stopLoading(this._loadingName);
                }));
    }

    private _reset$(preCallback?: () => void): Observable<void> {
        this._movedToId$.next(null);

        return makeNullImage$().pipe(
            tap(
                (image: Image): void => {
                    this._stateService.setImages([image]);
                    this._stateService.setImages([image]);
                    this._stateService.clearImages();
                }),
            first(),
            tap((): void => { if (preCallback) { preCallback(); }; }),
            mergeMap(
                (): Observable<void> => {
                    return this._graphService.reset$();
                }));
    }

    private _trajectoryIds$(): Observable<string[]> {
        return this._stateService.currentState$.pipe(
            first(),
            map(
                (frame: AnimationFrame): string[] => {
                    return frame.state.trajectory
                        .map(
                            (image: Image): string => {
                                return image.id;
                            })
                        .filter(
                            (id: string): boolean => {
                                return !isNullImageId(id);
                            });
                }));
    }
};
