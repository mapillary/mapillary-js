import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    merge as observableMerge,
    of as observableOf,
    Observable,
    Subscription,
} from "rxjs";

import {
    withLatestFrom,
    map,
    skip,
    filter,
    switchMap,
    share,
} from "rxjs/operators";

import {
    CreateHandlerBase,
    Geometry,
    OutlineCreateTag,
    RectGeometry,
} from "../../../Component";
import { Transform } from "../../../Geo";
import { RenderCamera } from "../../../Render";

export class CreateRectDragHandler extends CreateHandlerBase {
    private _addPointSubscription: Subscription;
    private _createSubscription: Subscription;
    private _deleteSubscription: Subscription;
    private _geometryCreatedSubscription: Subscription;
    private _initializeAnchorIndexingSubscription: Subscription;
    private _setVertexSubscription: Subscription;

    protected _enableCreate(): void {
        this._container.mouseService.claimMouse(this._name, 2);

        this._deleteSubscription = this._navigator.stateService.currentTransform$.pipe(
            map((transform: Transform): void => { return null; }),
            skip(1))
            .subscribe(this._tagCreator.delete$);

        this._createSubscription = this._mouseEventToBasic$(
            this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseDragStart$)).pipe(
                filter(this._validateBasic))
            .subscribe(this._tagCreator.createRect$);

        this._initializeAnchorIndexingSubscription = this._tagCreator.tag$.pipe(
            filter(
                (tag: OutlineCreateTag): boolean => {
                    return !!tag;
                }))
            .subscribe(
                (tag: OutlineCreateTag): void => {
                    (<RectGeometry>tag.geometry).initializeAnchorIndexing();
                });

        const basicMouse$: Observable<number[]> = observableCombineLatest(
            observableMerge(
                this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseMove$),
                this._container.mouseService.filtered$(this._name, this._container.mouseService.domMouseMove$)),
            this._container.renderService.renderCamera$).pipe(
                withLatestFrom(this._navigator.stateService.currentTransform$),
                map(
                    ([[event, camera], transform]: [[MouseEvent, RenderCamera], Transform]): number[] => {
                        return this._mouseEventToBasic(
                            event,
                            this._container.container,
                            camera,
                            transform);
                    }));

        this._setVertexSubscription = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: OutlineCreateTag): Observable<[OutlineCreateTag, number[], Transform]> => {
                    return !!tag ?
                        observableCombineLatest(
                            observableOf(tag),
                            basicMouse$,
                            this._navigator.stateService.currentTransform$) :
                        observableEmpty();
                }))
            .subscribe(
                ([tag, basicPoint, transform]: [OutlineCreateTag, number[], Transform]): void => {
                    (<RectGeometry>tag.geometry).setOppositeVertex2d(basicPoint, transform);
                });

        const basicMouseDragEnd$: Observable<number[]> = this._container.mouseService.mouseDragEnd$.pipe(
            withLatestFrom(
                this._mouseEventToBasic$(this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseDrag$)).pipe(
                    filter(this._validateBasic)),
                (event: Event, basicPoint: number[]): number[] => {
                    return basicPoint;
                }),
            share());

        this._addPointSubscription = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: OutlineCreateTag): Observable<[OutlineCreateTag, number[]]> => {
                    return !!tag ?
                        observableCombineLatest(
                            observableOf(tag),
                            basicMouseDragEnd$) :
                        observableEmpty();
                }))
            .subscribe(
                ([tag, basicPoint]: [OutlineCreateTag, number[]]): void => {
                    const rectGeometry: RectGeometry = <RectGeometry>tag.geometry;
                    if (!rectGeometry.validate(basicPoint)) {
                        basicPoint = rectGeometry.getNonAdjustedVertex2d(3);
                    }

                    tag.addPoint(basicPoint);
                });

        this._geometryCreatedSubscription = this._tagCreator.tag$.pipe(
            switchMap(
                (tag: OutlineCreateTag): Observable<Geometry> => {
                    return !!tag ?
                        tag.created$.pipe(
                            map(
                                (t: OutlineCreateTag): Geometry => {
                                    return t.geometry;
                                })) :
                        observableEmpty();
                }))
            .subscribe(this._geometryCreated$);
    }

    protected _disableCreate(): void {
        this._container.mouseService.unclaimMouse(this._name);

        this._tagCreator.delete$.next(null);

        this._addPointSubscription.unsubscribe();
        this._createSubscription.unsubscribe();
        this._deleteSubscription.unsubscribe();
        this._geometryCreatedSubscription.unsubscribe();
        this._initializeAnchorIndexingSubscription.unsubscribe();
        this._setVertexSubscription.unsubscribe();
    }

    protected _getNameExtension(): string {
        return "create-rect-drag";
    }
}

export default CreateRectDragHandler;
