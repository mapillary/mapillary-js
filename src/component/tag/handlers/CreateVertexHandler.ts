import {
    of as observableOf,
    empty as observableEmpty,
    combineLatest as observableCombineLatest,
    merge as observableMerge,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    filter,
    refCount,
    switchMap,
    skip,
    share,
    take,
    map,
    publishReplay,
} from "rxjs/operators";

import {
    CreateHandlerBase,
    Geometry,
    CreateTag,
} from "../../../Component";
import { Transform } from "../../../Geo";
import { RenderCamera } from "../../../Render";

export abstract class CreateVertexHandler extends CreateHandlerBase {
    private _addPointSubscription: Subscription;
    private _createSubscription: Subscription;
    private _deleteSubscription: Subscription;
    private _geometryCreateSubscription: Subscription;
    private _setVertexSubscription: Subscription;

    protected abstract get _create$(): Subject<number[]>;

    protected _enableCreate(): void {
        this._container.mouseService.deferPixels(this._name, 4);

        const transformChanged$: Observable<void> = this._navigator.stateService.currentTransform$.pipe(
            map((): void => { /*noop*/ }),
            publishReplay(1),
            refCount());

        this._deleteSubscription = transformChanged$.pipe(
            skip(1))
            .subscribe(this._tagCreator.delete$);

        const basicClick$: Observable<number[]> = this._mouseEventToBasic$(this._container.mouseService.proximateClick$).pipe(share());

        this._createSubscription = transformChanged$.pipe(
            switchMap(
                (): Observable<number[]> => {
                    return basicClick$.pipe(
                        filter(this._validateBasic),
                        take(1));
                }))
            .subscribe(this._create$);

        this._setVertexSubscription = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: CreateTag<Geometry>): Observable<[CreateTag<Geometry>, MouseEvent, RenderCamera, Transform]> => {
                    return !!tag ?
                        observableCombineLatest(
                            observableOf(tag),
                            observableMerge(
                                this._container.mouseService.mouseMove$,
                                this._container.mouseService.domMouseMove$),
                            this._container.renderService.renderCamera$,
                            this._navigator.stateService.currentTransform$) :
                        observableEmpty();
                }))
            .subscribe(
                ([tag, event, camera, transform]: [CreateTag<Geometry>, MouseEvent, RenderCamera, Transform]): void => {
                    const basicPoint: number[] = this._mouseEventToBasic(
                        event,
                        this._container.container,
                        camera,
                        transform);

                    this._setVertex2d(tag, basicPoint, transform);
                });

        this._addPointSubscription = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: CreateTag<Geometry>): Observable<[CreateTag<Geometry>, number[]]> => {
                    return !!tag ?
                        observableCombineLatest(
                            observableOf(tag),
                            basicClick$) :
                        observableEmpty();
                }))
            .subscribe(
                ([tag, basicPoint]: [CreateTag<Geometry>, number[]]): void => {
                    this._addPoint(tag, basicPoint);
                });

        this._geometryCreateSubscription = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: CreateTag<Geometry>): Observable<Geometry> => {
                    return !!tag ?
                        tag.created$.pipe(
                            map(
                                (t: CreateTag<Geometry>): Geometry => {
                                    return t.geometry;
                                })) :
                        observableEmpty();
                }))
            .subscribe(this._geometryCreated$);
    }

    protected abstract _addPoint(tag: CreateTag<Geometry>, basicPoint: number[]): void;

    protected abstract _setVertex2d(tag: CreateTag<Geometry>, basicPoint: number[], transform: Transform): void;

    protected _disableCreate(): void {
        this._container.mouseService.undeferPixels(this._name);

        this._tagCreator.delete$.next(null);

        this._addPointSubscription.unsubscribe();
        this._createSubscription.unsubscribe();
        this._deleteSubscription.unsubscribe();
        this._geometryCreateSubscription.unsubscribe();
        this._setVertexSubscription.unsubscribe();
    }
}

export default CreateVertexHandler;
