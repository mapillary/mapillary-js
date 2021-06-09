import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    zip as observableZip,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    bufferCount,
    catchError,
    distinctUntilChanged,
    filter,
    first,
    map,
    mergeMap,
    publishReplay,
    refCount,
    retry,
    scan,
    startWith,
    switchMap,
    timeout,
    withLatestFrom,
} from "rxjs/operators";

import { GraphMode } from "../graph/GraphMode";
import { GraphService } from "../graph/GraphService";
import { Image } from '../graph/Image';
import { Sequence } from "../graph/Sequence";
import { NavigationDirection } from "../graph/edge/NavigationDirection";
import { NavigationEdgeStatus } from "../graph/interfaces/NavigationEdgeStatus";
import { State } from "../state/State";
import { StateService } from "../state/StateService";
import { IAnimationState } from "../state/interfaces/IAnimationState";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { SubscriptionHolder } from "../util/SubscriptionHolder";

export class PlayService {
    public static readonly sequenceSpeed: number = 0.54;

    private _graphService: GraphService;
    private _stateService: StateService;

    private _imagesAhead: number;
    private _playing: boolean;
    private _speed: number;

    private _direction$: Observable<NavigationDirection>;
    private _directionSubject$: Subject<NavigationDirection>;
    private _playing$: Observable<boolean>;
    private _playingSubject$: Subject<boolean>;
    private _speed$: Observable<number>;
    private _speedSubject$: Subject<number>;

    private _playingSubscription: Subscription;
    private _cacheSubscription: Subscription;
    private _clearSubscription: Subscription;
    private _earthSubscription: Subscription;
    private _graphModeSubscription: Subscription;
    private _stopSubscription: Subscription;
    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    private _bridging$: Observable<Image>;

    constructor(graphService: GraphService, stateService: StateService) {
        this._graphService = graphService;
        this._stateService = stateService;

        const subs = this._subscriptions;

        this._directionSubject$ = new Subject<NavigationDirection>();
        this._direction$ = this._directionSubject$.pipe(
            startWith(NavigationDirection.Next),
            publishReplay(1),
            refCount());

        subs.push(this._direction$.subscribe());

        this._playing = false;
        this._playingSubject$ = new Subject<boolean>();
        this._playing$ = this._playingSubject$.pipe(
            startWith(this._playing),
            publishReplay(1),
            refCount());

        subs.push(this._playing$.subscribe());

        this._speed = 0.5;
        this._speedSubject$ = new Subject<number>();
        this._speed$ = this._speedSubject$.pipe(
            startWith(this._speed),
            publishReplay(1),
            refCount());

        subs.push(this._speed$.subscribe());

        this._imagesAhead = this._mapImagesAhead(this._mapSpeed(this._speed));

        this._bridging$ = null;
    }

    public get playing(): boolean {
        return this._playing;
    }

    public get direction$(): Observable<NavigationDirection> {
        return this._direction$;
    }

    public get playing$(): Observable<boolean> {
        return this._playing$;
    }

    public get speed$(): Observable<number> {
        return this._speed$;
    }

    public play(): void {
        if (this._playing) {
            return;
        }

        this._stateService.cutImages();
        const stateSpeed: number = this._setSpeed(this._speed);
        this._stateService.setSpeed(stateSpeed);

        this._graphModeSubscription = this._speed$.pipe(
            map(
                (speed: number): GraphMode => {
                    return speed > PlayService.sequenceSpeed ? GraphMode.Sequence : GraphMode.Spatial;
                }),
            distinctUntilChanged())
            .subscribe(
                (mode: GraphMode): void => {
                    this._graphService.setGraphMode(mode);
                });

        this._cacheSubscription = observableCombineLatest(
            this._stateService.currentImage$.pipe(
                map(
                    (image: Image): [string, string] => {
                        return [image.sequenceId, image.id];
                    }),
                distinctUntilChanged(
                    undefined,
                    ([sequenceId]: [string, string]): string => {
                        return sequenceId;
                    })),
            this._graphService.graphMode$,
            this._direction$).pipe(
                switchMap(
                    ([[sequenceId, imageId], mode, direction]: [[string, string], GraphMode, NavigationDirection]):
                        Observable<[Sequence, NavigationDirection]> => {

                        if (direction !== NavigationDirection.Next && direction !== NavigationDirection.Prev) {
                            return observableOf<[Sequence, NavigationDirection]>([undefined, direction]);
                        }

                        const sequence$: Observable<Sequence> = (mode === GraphMode.Sequence ?
                            this._graphService.cacheSequenceImages$(sequenceId, imageId) :
                            this._graphService.cacheSequence$(sequenceId)).pipe(
                                retry(3),
                                catchError(
                                    (error: Error): Observable<Sequence> => {
                                        console.error(error);

                                        return observableOf(undefined);
                                    }));

                        return observableCombineLatest(
                            sequence$,
                            observableOf(direction));
                    }),
                switchMap(
                    ([sequence, direction]: [Sequence, NavigationDirection]): Observable<string> => {
                        if (sequence === undefined) {
                            return observableEmpty();
                        }

                        const imageIds: string[] = sequence.imageIds.slice();
                        if (direction === NavigationDirection.Prev) {
                            imageIds.reverse();
                        }

                        return this._stateService.currentState$.pipe(
                            map(
                                (frame: AnimationFrame): [string, number] => {
                                    return [frame.state.trajectory[frame.state.trajectory.length - 1].id, frame.state.imagesAhead];
                                }),
                            scan(
                                (
                                    [lastRequestKey, previousRequestKeys]: [string, string[]],
                                    [lastTrajectoryKey, imagesAhead]: [string, number]):
                                    [string, string[]] => {

                                    if (lastRequestKey === undefined) {
                                        lastRequestKey = lastTrajectoryKey;
                                    }

                                    const lastIndex: number = imageIds.length - 1;
                                    if (imagesAhead >= this._imagesAhead || imageIds[lastIndex] === lastRequestKey) {
                                        return [lastRequestKey, []];
                                    }

                                    const current: number = imageIds.indexOf(lastTrajectoryKey);
                                    const start: number = imageIds.indexOf(lastRequestKey) + 1;
                                    const end: number = Math.min(lastIndex, current + this._imagesAhead - imagesAhead) + 1;

                                    if (end <= start) {
                                        return [lastRequestKey, []];
                                    }

                                    return [imageIds[end - 1], imageIds.slice(start, end)];
                                },
                                [undefined, []]),
                            mergeMap(
                                ([lastRequestKey, newRequestKeys]: [string, string[]]): Observable<string> => {
                                    return observableFrom(newRequestKeys);
                                }));
                    }),
                mergeMap(
                    (key: string): Observable<Image> => {
                        return this._graphService.cacheImage$(key).pipe(
                            catchError(
                                (): Observable<Image> => {
                                    return observableEmpty();
                                }));
                    },
                    6))
            .subscribe();

        this._playingSubscription = this._stateService.currentState$.pipe(
            filter(
                (frame: AnimationFrame): boolean => {
                    return frame.state.imagesAhead < this._imagesAhead;
                }),
            distinctUntilChanged(
                undefined,
                (frame: AnimationFrame): string => {
                    return frame.state.lastImage.id;
                }),
            map(
                (frame: AnimationFrame): [Image, boolean] => {
                    const lastImage: Image = frame.state.lastImage;
                    const trajectory: Image[] = frame.state.trajectory;
                    let increasingTime: boolean = undefined;

                    for (let i: number = trajectory.length - 2; i >= 0; i--) {
                        const image: Image = trajectory[i];
                        if (image.sequenceId !== lastImage.sequenceId) {
                            break;
                        }

                        if (image.capturedAt !== lastImage.capturedAt) {
                            increasingTime = image.capturedAt < lastImage.capturedAt;
                            break;
                        }
                    }

                    return [frame.state.lastImage, increasingTime];
                }),
            withLatestFrom(this._direction$),
            switchMap(
                ([[image, increasingTime], direction]: [[Image, boolean], NavigationDirection]): Observable<Image> => {
                    return observableZip(
                        ([NavigationDirection.Next, NavigationDirection.Prev].indexOf(direction) > -1 ?
                            image.sequenceEdges$ :
                            image.spatialEdges$).pipe(
                                first(
                                    (status: NavigationEdgeStatus): boolean => {
                                        return status.cached;
                                    }),
                                timeout(15000)),
                        observableOf<NavigationDirection>(direction)).pipe(
                            map(
                                ([s, d]: [NavigationEdgeStatus, NavigationDirection]): string => {
                                    for (let edge of s.edges) {
                                        if (edge.data.direction === d) {
                                            return edge.target;
                                        }
                                    }

                                    return null;
                                }),
                            switchMap(
                                (key: string): Observable<Image> => {
                                    return key != null ?
                                        this._graphService.cacheImage$(key) :
                                        observableEmpty();
                                }));
                }))
            .subscribe(
                (image: Image): void => {
                    this._stateService.appendImagess([image]);
                },
                (error: Error): void => {
                    console.error(error);
                    this.stop();
                });

        this._clearSubscription = this._stateService.currentImage$.pipe(
            bufferCount(1, 10))
            .subscribe(
                (images: Image[]): void => {
                    this._stateService.clearPriorImages();
                });

        this._setPlaying(true);

        const currentLastImages$: Observable<Image> = this._stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): IAnimationState => {
                    return frame.state;
                }),
            distinctUntilChanged(
                ([kc1, kl1]: [string, string], [kc2, kl2]: [string, string]): boolean => {
                    return kc1 === kc2 && kl1 === kl2;
                },
                (state: IAnimationState): [string, string] => {
                    return [state.currentImage.id, state.lastImage.id];
                }),
            filter(
                (state: IAnimationState): boolean => {
                    return state.currentImage.id === state.lastImage.id &&
                        state.currentIndex === state.trajectory.length - 1;
                }),
            map(
                (state: IAnimationState): Image => {
                    return state.currentImage;
                }));

        this._stopSubscription = observableCombineLatest(
            currentLastImages$,
            this._direction$).pipe(
                switchMap(
                    ([image, direction]: [Image, NavigationDirection]): Observable<boolean> => {
                        const edgeStatus$: Observable<NavigationEdgeStatus> = (
                            [NavigationDirection.Next, NavigationDirection.Prev].indexOf(direction) > -1 ?
                                image.sequenceEdges$ :
                                image.spatialEdges$).pipe(
                                    first(
                                        (status: NavigationEdgeStatus): boolean => {
                                            return status.cached;
                                        }),
                                    timeout(15000),
                                    catchError(
                                        (error: Error): Observable<NavigationEdgeStatus> => {
                                            console.error(error);

                                            return observableOf<NavigationEdgeStatus>({ cached: false, edges: [] });
                                        }));

                        return observableCombineLatest(
                            observableOf(direction),
                            edgeStatus$).pipe(
                                map(
                                    ([d, es]: [NavigationDirection, NavigationEdgeStatus]): boolean => {
                                        for (const edge of es.edges) {
                                            if (edge.data.direction === d) {
                                                return true;
                                            }
                                        }

                                        return false;
                                    }));
                    }),
                mergeMap(
                    (hasEdge: boolean): Observable<boolean> => {
                        if (hasEdge || !this._bridging$) {
                            return observableOf(hasEdge);
                        }

                        return this._bridging$.pipe(
                            map(
                                (image: Image): boolean => {
                                    return image != null;
                                }),
                            catchError(
                                (error: Error): Observable<boolean> => {
                                    console.error(error);

                                    return observableOf<boolean>(false);
                                }));
                    }),
                first(
                    (hasEdge: boolean): boolean => {
                        return !hasEdge;
                    }))
            .subscribe(
                undefined,
                undefined,
                (): void => { this.stop(); });

        if (this._stopSubscription.closed) {
            this._stopSubscription = null;
        }

        this._earthSubscription = this._stateService.state$
            .pipe(
                map(
                    (state: State): boolean => {
                        return state === State.Earth;
                    }),
                distinctUntilChanged(),
                first(
                    (earth: boolean): boolean => {
                        return earth;
                    }))
            .subscribe(
                undefined,
                undefined,
                (): void => { this.stop(); });

        if (this._earthSubscription.closed) {
            this._earthSubscription = null;
        }
    }

    public dispose(): void {
        this.stop();
        this._subscriptions.unsubscribe();
    }

    public setDirection(direction: NavigationDirection): void {
        this._directionSubject$.next(direction);
    }

    public setSpeed(speed: number): void {
        speed = Math.max(0, Math.min(1, speed));
        if (speed === this._speed) {
            return;
        }

        const stateSpeed: number = this._setSpeed(speed);

        if (this._playing) {
            this._stateService.setSpeed(stateSpeed);
        }

        this._speedSubject$.next(this._speed);
    }

    public stop(): void {
        if (!this._playing) {
            return;
        }

        if (!!this._stopSubscription) {
            if (!this._stopSubscription.closed) {
                this._stopSubscription.unsubscribe();
            }

            this._stopSubscription = null;
        }

        if (!!this._earthSubscription) {
            if (!this._earthSubscription.closed) {
                this._earthSubscription.unsubscribe();
            }

            this._earthSubscription = null;
        }

        this._graphModeSubscription.unsubscribe();
        this._graphModeSubscription = null;

        this._cacheSubscription.unsubscribe();
        this._cacheSubscription = null;

        this._playingSubscription.unsubscribe();
        this._playingSubscription = null;

        this._clearSubscription.unsubscribe();
        this._clearSubscription = null;

        this._stateService.setSpeed(1);
        this._stateService.cutImages();
        this._graphService.setGraphMode(GraphMode.Spatial);

        this._setPlaying(false);
    }

    private _mapSpeed(speed: number): number {
        const x: number = 2 * speed - 1;

        return Math.pow(10, x) - 0.2 * x;
    }

    private _mapImagesAhead(stateSpeed: number): number {
        return Math.round(Math.max(10, Math.min(50, 8 + 6 * stateSpeed)));
    }

    private _setPlaying(playing: boolean): void {
        this._playing = playing;
        this._playingSubject$.next(playing);
    }

    private _setSpeed(speed: number): number {
        this._speed = speed;
        const stateSpeed: number = this._mapSpeed(this._speed);
        this._imagesAhead = this._mapImagesAhead(stateSpeed);

        return stateSpeed;
    }
}
