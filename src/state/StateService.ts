import {
    BehaviorSubject,
    Observable,
    Subject,
} from "rxjs";

import {
    bufferCount,
    distinctUntilChanged,
    filter,
    first,
    map,
    pairwise,
    publishReplay,
    refCount,
    scan,
    share,
    startWith,
    switchMap,
    tap,
    withLatestFrom,
} from "rxjs/operators";

import { FrameGenerator } from "./FrameGenerator";
import { State } from "./State";
import { StateContext } from "./StateContext";
import { TransitionMode } from "./TransitionMode";
import { AnimationFrame } from "./interfaces/AnimationFrame";
import { EulerRotation } from "./interfaces/EulerRotation";
import { IStateContext } from "./interfaces/IStateContext";

import { LngLat } from "../api/interfaces/LngLat";
import { Camera } from "../geo/Camera";
import { Image } from "../graph/Image";
import { Transform } from "../geo/Transform";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { Clock } from "three";

interface IContextOperation {
    (context: IStateContext): IStateContext;
}

export class StateService {
    private _start$: Subject<void>;

    private _frame$: Subject<number>;

    private _contextOperation$: BehaviorSubject<IContextOperation>;
    private _context$: Observable<IStateContext>;
    private _state$: Observable<State>;

    private _currentState$: Observable<AnimationFrame>;
    private _lastState$: Observable<AnimationFrame>;
    private _currentImage$: Observable<Image>;
    private _currentImageExternal$: Observable<Image>;
    private _currentCamera$: Observable<Camera>;
    private _currentId$: BehaviorSubject<string>;
    private _currentTransform$: Observable<Transform>;
    private _reference$: Observable<LngLatAlt>;

    private _inMotionOperation$: Subject<boolean>;
    private _inMotion$: Observable<boolean>;

    private _inTranslationOperation$: Subject<boolean>;
    private _inTranslation$: Observable<boolean>;

    private _appendImage$: Subject<Image> = new Subject<Image>();

    private _frameGenerator: FrameGenerator;
    private _frameId: number;

    private _clock: Clock = new Clock();
    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();


    constructor(
        initialState: State,
        transitionMode?: TransitionMode) {

        const subs = this._subscriptions;

        this._start$ = new Subject<void>();
        this._frame$ = new Subject<number>();

        this._contextOperation$ = new BehaviorSubject<IContextOperation>(
            (context: IStateContext): IStateContext => {
                return context;
            });

        this._context$ = this._contextOperation$.pipe(
            scan(
                (context: IStateContext, operation: IContextOperation): IStateContext => {
                    return operation(context);
                },
                new StateContext(initialState, transitionMode)),
            publishReplay(1),
            refCount());

        this._state$ = this._context$.pipe(
            map(
                (context: IStateContext): State => {
                    return context.state;
                }),
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        this._currentState$ = this._frame$.pipe(
            withLatestFrom(
                this._context$,
                (frameId: number, context: IStateContext): [number, IStateContext] => {
                    return [frameId, context];
                }),
            filter(
                (fc: [number, IStateContext]): boolean => {
                    return fc[1].currentImage != null;
                }),
            tap(
                (fc: [number, IStateContext]): void => {
                    fc[1].update(this._clock.getDelta());
                }),
            map(
                (fc: [number, IStateContext]): AnimationFrame => {
                    return { fps: 60, id: fc[0], state: fc[1] };
                }),
            share());

        this._lastState$ = this._currentState$.pipe(
            publishReplay(1),
            refCount());

        let imageChanged$ = this._currentState$.pipe(
            distinctUntilChanged(
                undefined,
                (f: AnimationFrame): string => {
                    return f.state.currentImage.id;
                }),
            publishReplay(1),
            refCount());

        let imageChangedSubject$ = new Subject<AnimationFrame>();

        subs.push(imageChanged$
            .subscribe(imageChangedSubject$));

        this._currentId$ = new BehaviorSubject<string>(null);

        subs.push(imageChangedSubject$.pipe(
            map(
                (f: AnimationFrame): string => {
                    return f.state.currentImage.id;
                }))
            .subscribe(this._currentId$));

        this._currentImage$ = imageChangedSubject$.pipe(
            map(
                (f: AnimationFrame): Image => {
                    return f.state.currentImage;
                }),
            publishReplay(1),
            refCount());

        this._currentCamera$ = imageChangedSubject$.pipe(
            map(
                (f: AnimationFrame): Camera => {
                    return f.state.currentCamera;
                }),
            publishReplay(1),
            refCount());

        this._currentTransform$ = imageChangedSubject$.pipe(
            map(
                (f: AnimationFrame): Transform => {
                    return f.state.currentTransform;
                }),
            publishReplay(1),
            refCount());

        this._reference$ = imageChangedSubject$.pipe(
            map(
                (f: AnimationFrame): LngLatAlt => {
                    return f.state.reference;
                }),
            distinctUntilChanged(
                (r1: LngLat, r2: LngLat): boolean => {
                    return r1.lat === r2.lat && r1.lng === r2.lng;
                },
                (reference: LngLatAlt): LngLat => {
                    return { lat: reference.lat, lng: reference.lng };
                }),
            publishReplay(1),
            refCount());

        this._currentImageExternal$ = imageChanged$.pipe(
            map(
                (f: AnimationFrame): Image => {
                    return f.state.currentImage;
                }),
            publishReplay(1),
            refCount());

        subs.push(this._appendImage$.pipe(
            map(
                (image: Image) => {
                    return (context: IStateContext): IStateContext => {
                        context.append([image]);

                        return context;
                    };
                }))
            .subscribe(this._contextOperation$));

        this._inMotionOperation$ = new Subject<boolean>();

        subs.push(imageChanged$.pipe(
            map(
                (): boolean => {
                    return true;
                }))
            .subscribe(this._inMotionOperation$));

        subs.push(this._inMotionOperation$.pipe(
            distinctUntilChanged(),
            filter(
                (moving: boolean): boolean => {
                    return moving;
                }),
            switchMap(
                (): Observable<boolean> => {
                    return this._currentState$.pipe(
                        filter(
                            (frame: AnimationFrame): boolean => {
                                return frame.state.imagesAhead === 0;
                            }),
                        map(
                            (frame: AnimationFrame): [Camera, number] => {
                                return [frame.state.camera.clone(), frame.state.zoom];
                            }),
                        pairwise(),
                        map(
                            (pair: [[Camera, number], [Camera, number]]): boolean => {
                                let c1: Camera = pair[0][0];
                                let c2: Camera = pair[1][0];

                                let z1: number = pair[0][1];
                                let z2: number = pair[1][1];

                                return c1.diff(c2) > 1e-5 || Math.abs(z1 - z2) > 1e-5;
                            }),
                        first(
                            (changed: boolean): boolean => {
                                return !changed;
                            }));
                }))
            .subscribe(this._inMotionOperation$));

        this._inMotion$ = this._inMotionOperation$.pipe(
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        this._inTranslationOperation$ = new Subject<boolean>();

        subs.push(imageChanged$.pipe(
            map(
                (): boolean => {
                    return true;
                }))
            .subscribe(this._inTranslationOperation$));

        subs.push(this._inTranslationOperation$.pipe(
            distinctUntilChanged(),
            filter(
                (inTranslation: boolean): boolean => {
                    return inTranslation;
                }),
            switchMap(
                (): Observable<boolean> => {
                    return this._currentState$.pipe(
                        filter(
                            (frame: AnimationFrame): boolean => {
                                return frame.state.imagesAhead === 0;
                            }),
                        map(
                            (frame: AnimationFrame): THREE.Vector3 => {
                                return frame.state.camera.position.clone();
                            }),
                        pairwise(),
                        map(
                            (pair: [THREE.Vector3, THREE.Vector3]): boolean => {
                                return pair[0].distanceToSquared(pair[1]) !== 0;
                            }),
                        first(
                            (changed: boolean): boolean => {
                                return !changed;
                            }));
                }))
            .subscribe(this._inTranslationOperation$));

        this._inTranslation$ = this._inTranslationOperation$.pipe(
            distinctUntilChanged(),
            publishReplay(1),
            refCount());

        subs.push(this._state$.subscribe(() => { /*noop*/ }));
        subs.push(this._currentImage$.subscribe(() => { /*noop*/ }));
        subs.push(this._currentCamera$.subscribe(() => { /*noop*/ }));
        subs.push(this._currentTransform$.subscribe(() => { /*noop*/ }));
        subs.push(this._reference$.subscribe(() => { /*noop*/ }));
        subs.push(this._currentImageExternal$.subscribe(() => { /*noop*/ }));
        subs.push(this._lastState$.subscribe(() => { /*noop*/ }));
        subs.push(this._inMotion$.subscribe(() => { /*noop*/ }));
        subs.push(this._inTranslation$.subscribe(() => { /*noop*/ }));

        this._frameId = null;
        this._frameGenerator = new FrameGenerator(window);
    }

    public get currentState$(): Observable<AnimationFrame> {
        return this._currentState$;
    }

    public get currentImage$(): Observable<Image> {
        return this._currentImage$;
    }

    public get currentId$(): Observable<string> {
        return this._currentId$;
    }

    public get currentImageExternal$(): Observable<Image> {
        return this._currentImageExternal$;
    }

    public get currentCamera$(): Observable<Camera> {
        return this._currentCamera$;
    }

    public get currentTransform$(): Observable<Transform> {
        return this._currentTransform$;
    }

    public get state$(): Observable<State> {
        return this._state$;
    }

    public get reference$(): Observable<LngLatAlt> {
        return this._reference$;
    }

    public get inMotion$(): Observable<boolean> {
        return this._inMotion$;
    }

    public get inTranslation$(): Observable<boolean> {
        return this._inTranslation$;
    }

    public get appendImage$(): Subject<Image> {
        return this._appendImage$;
    }

    public dispose(): void {
        this.stop();
        this._subscriptions.unsubscribe();
    }

    public custom(): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => {
            context.custom();
        });
    }

    public earth(): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.earth(); });
    }

    public traverse(): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.traverse(); });
    }

    public wait(): void {
        this._invokeContextOperation((context: IStateContext) => { context.wait(); });
    }

    public waitInteractively(): void {
        this._invokeContextOperation((context: IStateContext) => { context.waitInteractively(); });
    }

    public appendImagess(images: Image[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.append(images); });
    }

    public prependImages(images: Image[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.prepend(images); });
    }

    public removeImages(n: number): void {
        this._invokeContextOperation((context: IStateContext) => { context.remove(n); });
    }

    public clearImages(): void {
        this._invokeContextOperation((context: IStateContext) => { context.clear(); });
    }

    public clearPriorImages(): void {
        this._invokeContextOperation((context: IStateContext) => { context.clearPrior(); });
    }

    public cutImages(): void {
        this._invokeContextOperation((context: IStateContext) => { context.cut(); });
    }

    public setImages(images: Image[]): void {
        this._invokeContextOperation((context: IStateContext) => { context.set(images); });
    }

    public setViewMatrix(matrix: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.setViewMatrix(matrix); });
    }

    public rotate(delta: EulerRotation): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotate(delta); });
    }

    public rotateUnbounded(delta: EulerRotation): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateUnbounded(delta); });
    }

    public rotateWithoutInertia(delta: EulerRotation): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateWithoutInertia(delta); });
    }

    public rotateBasic(basicRotation: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateBasic(basicRotation); });
    }

    public rotateBasicUnbounded(basicRotation: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateBasicUnbounded(basicRotation); });
    }

    public rotateBasicWithoutInertia(basicRotation: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateBasicWithoutInertia(basicRotation); });
    }

    public rotateToBasic(basic: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.rotateToBasic(basic); });
    }

    public move(delta: number): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.move(delta); });
    }

    public moveTo(position: number): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.moveTo(position); });
    }

    public dolly(delta: number): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.dolly(delta); });
    }

    public orbit(rotation: EulerRotation): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.orbit(rotation); });
    }

    public truck(direction: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.truck(direction); });
    }

    /**
     * Change zoom level while keeping the reference point position approximately static.
     *
     * @parameter {number} delta - Change in zoom level.
     * @parameter {Array<number>} reference - Reference point in basic coordinates.
     */
    public zoomIn(delta: number, reference: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.zoomIn(delta, reference); });
    }

    public getCenter(): Observable<number[]> {
        return this._lastState$.pipe(
            first(),
            map(
                (frame: AnimationFrame): number[] => {
                    return (<IStateContext>frame.state).getCenter();
                }));
    }

    public getZoom(): Observable<number> {
        return this._lastState$.pipe(
            first(),
            map(
                (frame: AnimationFrame): number => {
                    return frame.state.zoom;
                }));
    }

    public setCenter(center: number[]): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.setCenter(center); });
    }

    public setSpeed(speed: number): void {
        this._invokeContextOperation((context: IStateContext) => { context.setSpeed(speed); });
    }

    public setTransitionMode(mode: TransitionMode): void {
        this._invokeContextOperation((context: IStateContext) => { context.setTransitionMode(mode); });
    }

    public setZoom(zoom: number): void {
        this._inMotionOperation$.next(true);
        this._invokeContextOperation((context: IStateContext) => { context.setZoom(zoom); });
    }

    public start(): void {
        this._clock.start();
        if (this._frameId == null) {
            this._start$.next(null);
            this._frameId = this._frameGenerator.requestAnimationFrame(this._frame.bind(this));
            this._frame$.next(this._frameId);
        }
    }

    public stop(): void {
        this._clock.stop();
        if (this._frameId != null) {
            this._frameGenerator.cancelAnimationFrame(this._frameId);
            this._frameId = null;
        }
    }

    private _invokeContextOperation(action: (context: IStateContext) => void): void {
        this._contextOperation$
            .next(
                (context: IStateContext): IStateContext => {
                    action(context);
                    return context;
                });
    }

    private _frame(): void {
        this._frameId = this._frameGenerator.requestAnimationFrame(this._frame.bind(this));
        this._frame$.next(this._frameId);
    }
}
