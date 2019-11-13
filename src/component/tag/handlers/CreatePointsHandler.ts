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
    CreateVertexHandler,
    PolygonGeometry,
    Geometry,
} from "../../../Component";
import {Transform} from "../../../Geo";
import CreateHandlerBase from "./CreateHandlerBase";
import { RenderCamera } from "../../../Render";
import { ExtremePointCreateTag } from "../tag/ExtremePointCreateTag";

export class CreatePointsHandler extends CreateHandlerBase {
    private _addPointSubscription: Subscription;
    private _createSubscription: Subscription;
    private _deleteSubscription: Subscription;
    private _geometryCreateSubscription: Subscription;
    private _setVertexSubscription: Subscription;

    protected _enableCreate(): void {
        this._container.mouseService.deferPixels(this._name, 4);

        const transformChanged$: Observable<void> = this._navigator.stateService.currentTransform$.pipe(
            map((transform: Transform): void => { /*noop*/ }),
            publishReplay(1),
            refCount());

        this._deleteSubscription = transformChanged$.pipe(
            skip(1))
            .subscribe(this._tagCreator.deleteExtreme$);

        const basicClick$: Observable<number[]> = this._mouseEventToBasic$(this._container.mouseService.proximateClick$).pipe(share());

        this._createSubscription = transformChanged$.pipe(
            switchMap(
                (): Observable<number[]> => {
                    return basicClick$.pipe(
                        filter(this._validateBasic),
                        take(1));
                }))
            .subscribe(this._create$);

        this._setVertexSubscription = this._tagCreator.extremeTag$.pipe(
            switchMap(
                (tag: ExtremePointCreateTag): Observable<[ExtremePointCreateTag, MouseEvent, RenderCamera, Transform]> => {
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
                ([tag, event, camera, transform]: [ExtremePointCreateTag, MouseEvent, RenderCamera, Transform]): void => {
                    const basicPoint: number[] = this._mouseEventToBasic(
                        event,
                        this._container.element,
                        camera,
                        transform);

                    this._setVertex2d(tag, basicPoint, transform);
                });

        this._addPointSubscription = this._tagCreator.extremeTag$.pipe(
            switchMap(
                (tag: ExtremePointCreateTag): Observable<[ExtremePointCreateTag, number[]]> => {
                    return !!tag ?
                        observableCombineLatest(
                                observableOf(tag),
                                basicClick$) :
                        observableEmpty();
                }))
            .subscribe(
                ([tag, basicPoint]: [ExtremePointCreateTag, number[]]): void => {
                    this._addPoint(tag, basicPoint);
                });

        this._geometryCreateSubscription = this._tagCreator.extremeTag$.pipe(
            switchMap(
                (tag: ExtremePointCreateTag): Observable<Geometry> => {
                    return !!tag ?
                        tag.created$.pipe(
                            map(
                                (t: ExtremePointCreateTag): Geometry => {
                                    return t.geometry;
                                })) :
                        observableEmpty();
                }))
            .subscribe(this._geometryCreated$);
    }

    protected _disableCreate(): void {
        this._container.mouseService.undeferPixels(this._name);

        this._tagCreator.deleteExtreme$.next(null);

        this._addPointSubscription.unsubscribe();
        this._createSubscription.unsubscribe();
        this._deleteSubscription.unsubscribe();
        this._geometryCreateSubscription.unsubscribe();
        this._setVertexSubscription.unsubscribe();
    }

    protected _addPoint(tag: ExtremePointCreateTag, basicPoint: number[]): void {
        tag.geometry.addPoint2d(basicPoint);
    }

    protected get _create$(): Subject<number[]> {
        return this._tagCreator.createPoints$;
    }

    protected _getNameExtension(): string {
        return "create-points";
    }

    protected _setVertex2d(tag: ExtremePointCreateTag, basicPoint: number[], transform: Transform): void {
        tag.geometry.setPoint2d((tag.geometry).points.length - 1, basicPoint, transform);
    }
}

export default CreatePointsHandler;
