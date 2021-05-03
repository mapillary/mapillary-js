import {
    empty as observableEmpty,
    from as observableFrom,
    Observable,
} from "rxjs";

import {
    bufferCount,
    catchError,
    distinctUntilChanged,
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
        this._subscriptions = new SubscriptionHolder()
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

        subs.push(this._stateService.currentState$
            .pipe(
                distinctUntilChanged(
                    undefined,
                    (frame: AnimationFrame): string => {
                        return frame.state.currentImage.id;
                    }),
                map(
                    (frame: AnimationFrame): [string[], LngLat, string] => {
                        const state = frame.state;
                        const trajectory = state.trajectory;
                        const trajectoryKeys = trajectory
                            .map(
                                (n: Image): string => {
                                    return n.id;
                                });

                        const sequenceKey =
                            trajectory[trajectory.length - 1].sequenceId;

                        return [
                            trajectoryKeys,
                            state.currentImage.originalLngLat,
                            sequenceKey,
                        ];
                    }),
                bufferCount(1, 5),
                withLatestFrom(this._graphService.graphMode$),
                switchMap(
                    ([keepBuffer, graphMode]: [[string[], LngLat, string][], GraphMode]): Observable<void> => {
                        const keepKeys = keepBuffer[0][0];
                        const lngLat = keepBuffer[0][1];
                        const geometry = this._api.data.geometry;
                        const cellId = geometry.lngLatToCellId(lngLat)
                        const keepCellIds = connectedComponent(
                            cellId, this._cellDepth, geometry);
                        const keepSequenceKey =
                            graphMode === GraphMode.Sequence ?
                                keepBuffer[0][2] :
                                undefined;

                        return this._graphService
                            .uncache$(keepKeys, keepCellIds, keepSequenceKey);
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
            this._graphService.dataAdded$
                .pipe(
                    withLatestFrom(this._stateService.currentId$),
                    switchMap(
                        ([_, imageId]: [string, string]): Observable<Image> => {
                            return this._graphService.cacheImage$(imageId)
                        }))
                .subscribe(() => { /*noop*/ }))

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
}
