import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    CreateHandlerBase,
    Geometry,
    OutlineCreateTag,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {RenderCamera} from "../../../Render";

export class CreateRectDragHandler extends CreateHandlerBase {
    private _addPointSubscription: Subscription;
    private _createSubscription: Subscription;
    private _deleteSubscription: Subscription;
    private _geometryCreatedSubscription: Subscription;
    private _setVertexSubscription: Subscription;

    protected _enable(): void {
        this._container.mouseService.claimMouse(this._component.name, 1);

        const transformChanged$: Observable<void> = this._navigator.stateService.currentTransform$
            .map((transform: Transform): void => { /*noop*/ })
            .publishReplay(1)
            .refCount();

        this._deleteSubscription = transformChanged$
            .skip(1)
            .subscribe(this._tagCreator.delete$);

        const basicMouseDown$: Observable<number[]> = this._container.mouseService
            .filtered$(this._component.name, this._container.mouseService.mouseDown$)
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
            .map(
                ([event, camera, transform]: [MouseEvent, RenderCamera, Transform]): number[] => {
                    return this._mouseEventToBasic(
                        event,
                        this._container.element,
                        camera,
                        transform);
                })
            .share();

        const validBasicMouseDown$: Observable<number[]> = basicMouseDown$
            .filter(
                (basic: number[]): boolean => {
                    let x: number = basic[0];
                    let y: number = basic[1];

                    return 0 <= x && x <= 1 && 0 <= y && y <= 1;
                })
            .share();

        const validBasicMouseMove$: Observable<number[]> = this._container.mouseService.mouseMove$
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
            .map(
                ([event, camera, transform]: [MouseEvent, RenderCamera, Transform]): number[] => {
                    return this._mouseEventToBasic(
                        event,
                        this._container.element,
                        camera,
                        transform);
                })
            .filter(
                (basic: number[]): boolean => {
                    let x: number = basic[0];
                    let y: number = basic[1];

                    return 0 <= x && x <= 1 && 0 <= y && y <= 1;
                })
            .share();

        this._createSubscription = transformChanged$
            .switchMap(
                (): Observable<number[]> => {
                    return validBasicMouseDown$.take(1);
                })
            .subscribe(this._tagCreator.create$);

        this._setVertexSubscription = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<[OutlineCreateTag, MouseEvent, RenderCamera, Transform]> => {
                    return !!tag ?
                        Observable
                            .combineLatest(
                                Observable.of(tag),
                                Observable
                                    .merge(
                                        this._container.mouseService.mouseMove$,
                                        this._container.mouseService.domMouseMove$),
                                this._container.renderService.renderCamera$,
                                this._navigator.stateService.currentTransform$) :
                        Observable.empty();
                })
            .subscribe(
                ([tag, event, camera, transform]: [OutlineCreateTag, MouseEvent, RenderCamera, Transform]): void => {
                    const basicPoint: number[] = this._mouseEventToBasic(
                        event,
                        this._container.element,
                        camera,
                        transform);

                    tag.geometry.setVertex2d(3, basicPoint, transform);
                });

        const basicMouseUp$: Observable<number[]> = Observable
            .merge(
                Observable.fromEvent<Event>(window, "blur"),
                this._container.mouseService
                    .filtered$(this._component.name, this._container.mouseService.documentMouseUp$))
            .withLatestFrom(
                validBasicMouseMove$,
                (event: MouseEvent, basicPoint: number[]): number[] => {
                    return basicPoint;
                })
            .share();

        this._addPointSubscription = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<[OutlineCreateTag, number[]]> => {
                    return !!tag ?
                        Observable
                            .combineLatest(
                                Observable.of(tag),
                                basicMouseUp$) :
                        Observable.empty();
                })
            .subscribe(
                ([tag, basicPoint]: [OutlineCreateTag, number[]]): void => {
                    tag.addPoint(basicPoint);
                });

        this._geometryCreatedSubscription = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<Geometry> => {
                    return !!tag ?
                        tag.created$
                            .map(
                                (t: OutlineCreateTag): Geometry => {
                                    return t.geometry;
                                }) :
                        Observable.empty();
                })
            .subscribe(this._geometryCreated$);
    }

    protected _disable(): void {
        this._container.mouseService.unclaimMouse(this._component.name);

        this._tagCreator.delete$.next(null);

        this._addPointSubscription.unsubscribe();
        this._createSubscription.unsubscribe();
        this._deleteSubscription.unsubscribe();
        this._geometryCreatedSubscription.unsubscribe();
        this._setVertexSubscription.unsubscribe();
    }
}

export default CreateRectDragHandler;
