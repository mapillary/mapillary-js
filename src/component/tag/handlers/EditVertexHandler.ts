import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    Component,
    CreateHandlerBase,
    Geometry,
    IInteraction,
    ITagConfiguration,
    RenderTag,
    Tag,
    TagCreator,
    TagOperation,
    TagSet,
    VertexGeometry,
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

export class EditVertexHandler extends CreateHandlerBase {
    private _tagSet: TagSet;

    private _claimMouseSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _unclaimMouseSubscription: Subscription;
    private _updateGeometrySubscription: Subscription;

    constructor(
        component: Component<ITagConfiguration>,
        container: Container,
        navigator: Navigator,
        tagCreator: TagCreator,
        viewportCoords: ViewportCoords,
        tagSet: TagSet) {
        super(component, container, navigator, tagCreator, viewportCoords);

        this._tagSet = tagSet;
    }

    protected _enable(): void {
        const interaction$: Observable<IInteraction> = this._tagSet.changed$
            .map(
                (tagSet: TagSet): RenderTag<Tag>[] => {
                    return tagSet.getAll();
                })
            .switchMap(
                (tags: RenderTag<Tag>[]): Observable<IInteraction> => {
                    return Observable
                        .from(tags)
                        .mergeMap(
                            (tag: RenderTag<Tag>): Observable<IInteraction> => {
                                return tag.interact$;
                            });
                })
            .merge<IInteraction>(
                this._container.mouseService.documentMouseUp$
                    .map(
                        (): IInteraction => {
                            return { offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: null };
                        }))
            .share();

        const mouseMove$: Observable<MouseEvent> = Observable
            .merge(
                this._container.mouseService.mouseMove$,
                this._container.mouseService.domMouseMove$)
            .share();

        this._claimMouseSubscription = interaction$
            .switchMap(
                (interaction: IInteraction): Observable<MouseEvent> => {
                    return !!interaction.tag ? mouseMove$.take(1) : Observable.empty();
                })
            .subscribe(
                (e: MouseEvent): void => {
                    this._container.mouseService.claimMouse(this._component.name, 1);
                });

        this._unclaimMouseSubscription = this._container.mouseService
            .filtered$(this._component.name, this._container.mouseService.domMouseDragEnd$)
            .subscribe(
                (e: MouseEvent): void => {
                    this._container.mouseService.unclaimMouse(this._component.name);
                });

        this._preventDefaultSubscription = interaction$
            .switchMap(
                (interaction: IInteraction): Observable<MouseEvent> => {
                    return !!interaction.tag ?
                        this._container.mouseService.documentMouseMove$ :
                        Observable.empty<MouseEvent>();
                })
            .subscribe(
                (event: MouseEvent): void => {
                    event.preventDefault(); // prevent selection of content outside the viewer
                });

        this._updateGeometrySubscription = interaction$
            .withLatestFrom(mouseMove$)
            .switchMap(
                ([interaction, mouseMove]: [IInteraction, MouseEvent]): Observable<[MouseEvent, RenderCamera, IInteraction, Transform]> => {
                    if (interaction.operation === TagOperation.None || !interaction.tag) {
                        return Observable.empty<[MouseEvent, RenderCamera, IInteraction, Transform]>();
                    }

                    const mouseDrag$: Observable<MouseEvent> = Observable
                        .of<MouseEvent>(mouseMove)
                        .concat<MouseEvent>(
                            this._container.mouseService
                                .filtered$(
                                    this._component.name,
                                    this._container.mouseService.domMouseDrag$)
                                .filter(
                                    (event: MouseEvent): boolean => {
                                        return this._viewportCoords.insideElement(event, this._container.element);
                                    }));

                    return Observable
                        .combineLatest<MouseEvent, RenderCamera>(
                            mouseDrag$,
                            this._container.renderService.renderCamera$)
                        .withLatestFrom(
                            Observable.of(interaction),
                            this._navigator.stateService.currentTransform$,
                            (
                                [event, render]: [MouseEvent, RenderCamera],
                                i: IInteraction,
                                transform: Transform):
                                [MouseEvent, RenderCamera, IInteraction, Transform] => {
                                return [event, render, i, transform];
                            });
                })
            .subscribe(
                ([mouseEvent, renderCamera, interaction, transform]: [MouseEvent, RenderCamera, IInteraction, Transform]): void => {
                    const basic: number[] = this._mouseEventToBasic(
                        mouseEvent,
                        this._container.element,
                        renderCamera,
                        transform,
                        interaction.offsetX,
                        interaction.offsetY);

                    const geometry: Geometry = interaction.tag.geometry;
                    if (interaction.operation === TagOperation.Centroid) {
                        geometry.setCentroid2d(basic, transform);
                    } else if (interaction.operation === TagOperation.Vertex) {
                        (<VertexGeometry>geometry).setVertex2d(interaction.vertexIndex, basic, transform);
                    }
                });
    }

    protected _disable(): void {
        this._claimMouseSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._unclaimMouseSubscription.unsubscribe();
        this._updateGeometrySubscription.unsubscribe();
    }
}

export default EditVertexHandler;
