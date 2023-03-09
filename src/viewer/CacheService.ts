import {
    empty as observableEmpty,
    merge as observableMerge,
    from as observableFrom,
    Observable,
} from "rxjs";

import {
    bufferCount,
    catchError,
    distinctUntilChanged,
    filter,
    first,
    map,
    mergeMap,
    skip,
    switchMap,
    timeout,
    withLatestFrom,
} from "rxjs/operators";

import { GraphMode } from "../graph/GraphMode";
import { GraphService } from "../graph/GraphService";
import { Image } from "../graph/Image";
import { NavigationEdgeStatus } from "../graph/interfaces/NavigationEdgeStatus";
import { StateService } from "../state/StateService";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { connectedComponent } from "../api/CellMath";
import { APIWrapper } from "../api/APIWrapper";
import { LngLat } from "../api/interfaces/LngLat";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { isNullImageId } from "../util/Common";

interface CacheState {
    lngLat: LngLat,
    sequenceId: string,
    trajectoryIds: string[],
}

interface CacheKeepers {
    cellIds: string[];
    imageIds: string[];
    sequenceId: string;
}

export interface CacheServiceConfiguration {
    cellDepth: number;
}

export class CacheService {
    private _subscriptions: SubscriptionHolder;
    private _started: boolean;
    private _cellDepth: number;

    constructor(
        private readonly _graphService: GraphService,
        private readonly _stateService: StateService,
        private readonly _api: APIWrapper) {
        this._subscriptions = new SubscriptionHolder();
        this._started = false;
        this._cellDepth = 1;
    }

    public get started(): boolean {
        return this._started;
    }

    public configure(configuration?: CacheServiceConfiguration): void {
        if (!configuration) {
            this._cellDepth = 1;
            return;
        }
        this._cellDepth = Math.max(1, Math.min(3, configuration.cellDepth));
    }

    public start(): void {
        if (this._started) { return; }

        const subs = this._subscriptions;

        subs.push(this._stateService.reference$
            .pipe(
                withLatestFrom(
                    this._stateService.currentState$,
                    this._graphService.graphMode$),
                map(
                    ([, frame, mode]: [LngLatAlt, AnimationFrame, GraphMode]): CacheKeepers => {
                        const state = this._frameToState(frame);
                        return this._makeKeepers(state, mode);
                    }),
                switchMap(
                    (keepers: CacheKeepers): Observable<void> => {
                        return this._graphService
                            .uncache$(
                                keepers.imageIds,
                                keepers.cellIds,
                                keepers.sequenceId);
                    }))
            .subscribe(() => { /*noop*/ }));

        subs.push(this._stateService.currentState$
            .pipe(
                distinctUntilChanged(
                    undefined,
                    (frame: AnimationFrame): string => {
                        return frame.state.currentImage.id;
                    }),
                map(
                    (frame: AnimationFrame): CacheState => {
                        return this._frameToState(frame);
                    }),
                bufferCount(1, 5),
                withLatestFrom(this._graphService.graphMode$),
                switchMap(
                    ([stateBuffer, graphMode]: [CacheState[], GraphMode]): Observable<void> => {
                        const keepers = this._makeKeepers(stateBuffer[0], graphMode);
                        return this._graphService
                            .uncache$(
                                keepers.imageIds,
                                keepers.cellIds,
                                keepers.sequenceId);
                    }))
            .subscribe(() => { /*noop*/ }));

        subs.push(this._graphService.graphMode$
            .pipe(
                skip(1),
                withLatestFrom(this._stateService.currentState$),
                switchMap(
                    ([mode, frame]: [GraphMode, AnimationFrame]): Observable<NavigationEdgeStatus> => {
                        return mode === GraphMode.Sequence ?
                            this._keyToEdges(
                                frame.state.currentImage.id,
                                (image: Image)
                                    : Observable<NavigationEdgeStatus> => {
                                    return image.sequenceEdges$;
                                }) :
                            observableFrom(frame.state.trajectory
                                .map(
                                    (image: Image): string => {
                                        return image.id;
                                    })
                                .slice(frame.state.currentIndex)).pipe(
                                    mergeMap(
                                        (key: string): Observable<NavigationEdgeStatus> => {
                                            return this._keyToEdges(
                                                key,
                                                (image: Image): Observable<NavigationEdgeStatus> => {
                                                    return image.spatialEdges$;
                                                });
                                        },
                                        6));
                    }))
            .subscribe(() => { /*noop*/ }));

        subs.push(
            observableMerge(
                this._graphService.dataAdded$,
                this._graphService.dataDeleted$)
                .pipe(
                    withLatestFrom(this._stateService.currentId$),
                    switchMap(
                        ([_, imageId]: [string, string]): Observable<Image> => {
                            return this._graphService.hasImage$(imageId).pipe(
                                filter((exists: boolean): boolean => {
                                    return exists;
                                }),
                                mergeMap((): Observable<Image> => {
                                    return this._graphService.cacheImage$(imageId)
                                        .pipe(catchError(
                                            (error): Observable<Image> => {
                                                console.warn(
                                                    `Cache service data event caching failed ${imageId}`,
                                                    error);
                                                return observableEmpty();
                                            }));
                                }));
                        }))
                .subscribe(() => { /*noop*/ }));

        this._started = true;
    }

    public stop(): void {
        if (!this._started) { return; }

        this._subscriptions.unsubscribe();
        this._started = false;
    }

    private _keyToEdges(
        key: string,
        imageToEdgeMap: (image: Image) => Observable<NavigationEdgeStatus>)
        : Observable<NavigationEdgeStatus> {

        return this._graphService.cacheImage$(key).pipe(
            switchMap(imageToEdgeMap),
            first(
                (status: NavigationEdgeStatus): boolean => {
                    return status.cached;
                }),
            timeout(15000),
            catchError(
                (error: Error): Observable<NavigationEdgeStatus> => {
                    console.error(`Failed to cache edges (${key}).`, error);

                    return observableEmpty();
                }));
    }

    private _frameToState(frame: AnimationFrame): CacheState {
        const state = frame.state;
        const trajectory = state.trajectory;
        const trajectoryIds = trajectory
            .map(
                (n: Image): string => {
                    return n.id;
                });

        const sequenceId =
            trajectory[trajectory.length - 1].sequenceId;

        return {
            lngLat: state.currentImage.originalLngLat,
            sequenceId,
            trajectoryIds,
        };
    }

    private _makeKeepers(state: CacheState, graphMode: GraphMode): CacheKeepers {
        const imageIds = state.trajectoryIds.filter(id => !isNullImageId(id));
        const lngLat = state.lngLat;
        const geometry = this._api.data.geometry;
        const cellId = geometry.lngLatToCellId(lngLat);
        const cellIds = connectedComponent(
            cellId, this._cellDepth, geometry);
        const sequenceId =
            graphMode === GraphMode.Sequence ?
                state.sequenceId :
                undefined;

        return { cellIds, imageIds, sequenceId };
    }
}
