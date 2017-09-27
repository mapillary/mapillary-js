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
    private _initializeAnchorIndexingSubscription: Subscription;
    private _setVertexSubscription: Subscription;

    constructor(
        component: Component<ITagConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords,
        tagCreator: TagCreator) {
        super(component, container, navigator, viewportCoords, tagCreator);

        this._name = this._component.name + "-create-rect-drag";
    }

    protected _enable(): void {
        this._container.mouseService.claimMouse(this._name, 2);

        this._deleteSubscription = this._navigator.stateService.currentTransform$
            .map((transform: Transform): void => { return null; })
            .skip(1)
            .subscribe(this._tagCreator.delete$);

        this._createSubscription = this._mouseEventToBasic$(
                this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseDragStart$))
            .filter(this._validateBasic)
            .subscribe(this._tagCreator.createRect$);

        this._initializeAnchorIndexingSubscription = this._tagCreator.tag$
            .filter(
                (tag: OutlineCreateTag): boolean => {
                    return !!tag;
                })
            .subscribe(
                (tag: OutlineCreateTag): void => {
                    (<RectGeometry>tag.geometry).initializeAnchorIndexing();
                });

        const basicMouse$: Observable<number[]> = Observable
            .merge(
                this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseMove$),
                this._container.mouseService.filtered$(this._name, this._container.mouseService.domMouseMove$))
            .combineLatest(this._container.renderService.renderCamera$)
            .withLatestFrom(this._navigator.stateService.currentTransform$)
                .map(
                    ([[event, camera], transform]: [[MouseEvent, RenderCamera], Transform]): number[] => {
                        return this._mouseEventToBasic(
                            event,
                            this._container.element,
                            camera,
                            transform);
                    });

        this._setVertexSubscription = this._tagCreator.tag$
            .switchMap(
                (tag: OutlineCreateTag): Observable<[OutlineCreateTag, number[], Transform]> => {
                    return !!tag ?
                        Observable
                            .combineLatest(
                                Observable.of(tag),
                                basicMouse$,
                                this._navigator.stateService.currentTransform$) :
                        Observable.empty();
                })
            .subscribe(
                ([tag, basicPoint, transform]: [OutlineCreateTag, number[], Transform]): void => {
                    (<RectGeometry>tag.geometry).setOppositeVertex2d(basicPoint, transform);
                });

        const basicMouseDragEnd$: Observable<number[]> = this._container.mouseService.mouseDragEnd$
            .withLatestFrom(
                this._mouseEventToBasic$(this._container.mouseService.filtered$(this._name, this._container.mouseService.mouseDrag$))
                    .filter(this._validateBasic),
                (event: Event, basicPoint: number[]): number[] => {
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
                        basicPoint = rectGeometry.getNonAdjustedVertex2d(3);
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
        this._initializeAnchorIndexingSubscription.unsubscribe();
        this._setVertexSubscription.unsubscribe();
    }
}

export default CreateRectDragHandler;
