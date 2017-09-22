import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    Component,
    CreateHandlerBase,
    Geometry,
    ITagConfiguration,
    OutlineCreateTag,
    RectGeometry,
    TagCreator,
} from "../../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../../Geo";
import {RenderCamera} from "../../../Render";
import {
    Container,
    Navigator,
} from "../../../Viewer";

export class CreateRectDragHandler extends CreateHandlerBase {
    private _name: string;

    private _addPointSubscription: Subscription;
    private _createSubscription: Subscription;
    private _deleteSubscription: Subscription;
    private _geometryCreatedSubscription: Subscription;
    private _setVertexSubscription: Subscription;

    constructor(
        component: Component<ITagConfiguration>,
        container: Container,
        navigator: Navigator,
        tagCreator: TagCreator,
        viewportCoords: ViewportCoords) {
        super(component, container, navigator, tagCreator, viewportCoords);

        this._name = this._component.name + "-create-rect-drag";
    }

    protected _enable(): void {
        this._container.mouseService.claimMouse(this._name, 2);

        this._deleteSubscription = this._navigator.stateService.currentTransform$
            .map((transform: Transform): void => { return null; })
            .skip(1)
            .subscribe(this._tagCreator.delete$);

        const basicMouseDragStart$: Observable<number[]> = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDragStart$)
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

        const validBasicMouseDragStart$: Observable<number[]> = basicMouseDragStart$
            .filter(
                (basic: number[]): boolean => {
                    let x: number = basic[0];
                    let y: number = basic[1];

                    return 0 <= x && x <= 1 && 0 <= y && y <= 1;
                })
            .share();

        this._createSubscription = validBasicMouseDragStart$
            .subscribe(this._tagCreator.createRect$);

        const basicMouseDrag$: Observable<number[]> = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.mouseDrag$)
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

        const validBasicMouseDrag$: Observable<number[]> = basicMouseDrag$
            .filter(
                (basic: number[]): boolean => {
                    let x: number = basic[0];
                    let y: number = basic[1];

                    return 0 <= x && x <= 1 && 0 <= y && y <= 1;
                })
            .share();

        const basicContainerMouseMove$: Observable<number[]> = Observable
            .merge(
                this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseMove$),
                this._container.mouseService.filtered$(this._name, this._container.mouseService.domMouseMove$))
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

        this._setVertexSubscription = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<[OutlineCreateTag, number[], Transform]> => {
                    return !!tag ?
                        Observable
                            .combineLatest(
                                Observable.of(tag),
                                basicContainerMouseMove$,
                                this._navigator.stateService.currentTransform$) :
                        Observable.empty();
                })
            .subscribe(
                ([tag, basicPoint, transform]: [OutlineCreateTag, number[], Transform]): void => {
                    tag.geometry.setVertex2d(3, basicPoint, transform);
                });

        const basicMouseDragEnd$: Observable<number[]> = this._container.mouseService.mouseDragEnd$
            .withLatestFrom(
                validBasicMouseDrag$,
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
                                basicMouseDragEnd$) :
                        Observable.empty();
                })
            .subscribe(
                ([tag, basicPoint]: [OutlineCreateTag, number[]]): void => {
                    const rectGeometry: RectGeometry = <RectGeometry>tag.geometry;
                    if (!rectGeometry.validate(basicPoint)) {
                        basicPoint = rectGeometry.getVertex2d(3);
                    }

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
        this._container.mouseService.unclaimMouse(this._name);

        this._tagCreator.delete$.next(null);

        this._addPointSubscription.unsubscribe();
        this._createSubscription.unsubscribe();
        this._deleteSubscription.unsubscribe();
        this._geometryCreatedSubscription.unsubscribe();
        this._setVertexSubscription.unsubscribe();
    }
}

export default CreateRectDragHandler;
