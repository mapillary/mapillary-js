import {
    filter,
    map,
    publishReplay,
    refCount,
    scan,
    skip,
    startWith,
    tap,
    withLatestFrom,
} from "rxjs/operators";

import {
    BehaviorSubject,
    Observable,
    Subject,
} from "rxjs";

import { RenderCamera } from "./RenderCamera";
import { RenderMode } from "./RenderMode";
import { ViewportSize } from "./interfaces/ViewportSize";

import { Spatial } from "../geo/Spatial";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { SubscriptionHolder } from "../util/SubscriptionHolder";

interface RenderCameraOperation {
    (rc: RenderCamera): RenderCamera;
}

export class RenderService {
    private _bearing$: Observable<number>;

    private _element: HTMLElement;
    private _currentFrame$: Observable<AnimationFrame>;

    private _projectionMatrix$: Subject<number[]>;

    private _renderCameraOperation$: Subject<RenderCameraOperation>;
    private _renderCameraHolder$: Observable<RenderCamera>;
    private _renderCameraFrame$: Observable<RenderCamera>;
    private _renderCamera$: Observable<RenderCamera>;

    private _resize$: Subject<void>;
    private _size$: BehaviorSubject<ViewportSize>;

    private _spatial: Spatial;

    private _renderMode$: BehaviorSubject<RenderMode>;

    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    constructor(
        element: HTMLElement,
        currentFrame$: Observable<AnimationFrame>,
        renderMode: RenderMode,
        renderCamera?: RenderCamera) {

        this._element = element;
        this._currentFrame$ = currentFrame$;

        this._spatial = new Spatial();

        renderMode = renderMode != null ? renderMode : RenderMode.Fill;

        this._resize$ = new Subject<void>();
        this._projectionMatrix$ = new Subject<number[]>();
        this._renderCameraOperation$ =
            new Subject<RenderCameraOperation>();

        this._size$ =
            new BehaviorSubject<ViewportSize>({
                height: this._element.offsetHeight,
                width: this._element.offsetWidth,
            });

        const subs = this._subscriptions;
        subs.push(this._resize$.pipe(
            map(
                (): ViewportSize => {
                    return {
                        height: this._element.offsetHeight,
                        width: this._element.offsetWidth,
                    };
                }))
            .subscribe(this._size$));

        this._renderMode$ = new BehaviorSubject<RenderMode>(renderMode);

        this._renderCameraHolder$ = this._renderCameraOperation$.pipe(
            startWith(
                (rc: RenderCamera): RenderCamera => {
                    return rc;
                }),
            scan(
                (rc: RenderCamera, operation: RenderCameraOperation): RenderCamera => {
                    return operation(rc);
                },
                renderCamera ??
                new RenderCamera(
                    this._element.offsetWidth,
                    this._element.offsetHeight,
                    renderMode)),
            publishReplay(1),
            refCount());

        this._renderCameraFrame$ = this._currentFrame$.pipe(
            withLatestFrom(this._renderCameraHolder$),
            tap(
                ([frame, rc]: [AnimationFrame, RenderCamera]): void => {
                    rc.setFrame(frame);
                }),
            map(
                (args: [AnimationFrame, RenderCamera]): RenderCamera => {
                    return args[1];
                }),
            publishReplay(1),
            refCount());

        this._renderCamera$ = this._renderCameraFrame$.pipe(
            filter(
                (rc: RenderCamera): boolean => {
                    return rc.changed;
                }),
            publishReplay(1),
            refCount());

        this._bearing$ = this._renderCamera$.pipe(
            map(
                (rc: RenderCamera): number => {
                    let bearing: number =
                        this._spatial.radToDeg(
                            this._spatial.azimuthalToBearing(rc.rotation.phi));

                    return this._spatial.wrap(bearing, 0, 360);
                }),
            publishReplay(1),
            refCount());

        subs.push(this._size$.pipe(
            skip(1),
            map(
                (size: ViewportSize) => {
                    return (rc: RenderCamera): RenderCamera => {
                        rc.setSize(size);

                        return rc;
                    };
                }))
            .subscribe(this._renderCameraOperation$));

        subs.push(this._renderMode$.pipe(
            skip(1),
            map(
                (rm: RenderMode) => {
                    return (rc: RenderCamera): RenderCamera => {
                        rc.setRenderMode(rm);

                        return rc;
                    };
                }))
            .subscribe(this._renderCameraOperation$));

        subs.push(this._projectionMatrix$.pipe(
            map(
                (projectionMatrix: number[]) => {
                    return (rc: RenderCamera): RenderCamera => {
                        rc.setProjectionMatrix(projectionMatrix);

                        return rc;
                    };
                }))
            .subscribe(this._renderCameraOperation$));

        subs.push(this._bearing$.subscribe(() => { /*noop*/ }));
        subs.push(this._renderCameraHolder$.subscribe(() => { /*noop*/ }));
        subs.push(this._size$.subscribe(() => { /*noop*/ }));
        subs.push(this._renderMode$.subscribe(() => { /*noop*/ }));
        subs.push(this._renderCamera$.subscribe(() => { /*noop*/ }));
        subs.push(this._renderCameraFrame$.subscribe(() => { /*noop*/ }));
    }

    public get bearing$(): Observable<number> {
        return this._bearing$;
    }

    public get element(): HTMLElement {
        return this._element;
    }

    public get projectionMatrix$(): Subject<number[]> {
        return this._projectionMatrix$;
    }

    public get renderCamera$(): Observable<RenderCamera> {
        return this._renderCamera$;
    }

    public get renderCameraFrame$(): Observable<RenderCamera> {
        return this._renderCameraFrame$;
    }

    public get renderMode$(): Subject<RenderMode> {
        return this._renderMode$;
    }

    public get resize$(): Subject<void> {
        return this._resize$;
    }

    public get size$(): Observable<ViewportSize> {
        return this._size$;
    }

    public dispose(): void {
        this._subscriptions.unsubscribe();
    }
}
