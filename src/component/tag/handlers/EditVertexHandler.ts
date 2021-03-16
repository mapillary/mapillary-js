import {
    combineLatest as observableCombineLatest,
    concat as observableConcat,
    empty as observableEmpty,
    from as observableFrom,
    merge as observableMerge,
    of as observableOf,
    Observable,
    Subscription,
} from "rxjs";

import {
    distinctUntilChanged,
    filter,
    first,
    map,
    mergeMap,
    share,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import { Transform } from "../../../geo/Transform";
import { ViewportCoords } from "../../../geo/ViewportCoords";
import { RenderCamera } from "../../../render/RenderCamera";
import { Container } from "../../../viewer/Container";
import { Component } from "../../Component";
import { Navigator } from "../../../viewer/Navigator";
import { TagConfiguration } from "../../interfaces/TagConfiguration";
import { Geometry } from "../geometry/Geometry";
import { VertexGeometry } from "../geometry/VertexGeometry";
import { TagInteraction, InteractionCursor } from "../interfaces/TagInteraction";
import { RenderTag } from "../tag/RenderTag";
import { Tag } from "../tag/Tag";
import { TagOperation } from "../TagOperation";
import { TagSet } from "../TagSet";
import { TagHandlerBase } from "./TagHandlerBase";

export class EditVertexHandler extends TagHandlerBase {
    private _tagSet: TagSet;

    private _claimMouseSubscription: Subscription;
    private _cursorSubscription: Subscription;
    private _preventDefaultSubscription: Subscription;
    private _unclaimMouseSubscription: Subscription;
    private _updateGeometrySubscription: Subscription;

    constructor(
        component: Component<TagConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords,
        tagSet: TagSet) {
        super(component, container, navigator, viewportCoords);

        this._tagSet = tagSet;
    }

    protected _enable(): void {
        const interaction$: Observable<TagInteraction> = this._tagSet.changed$.pipe(
            map(
                (tagSet: TagSet): RenderTag<Tag>[] => {
                    return tagSet.getAll();
                }),
            switchMap(
                (tags: RenderTag<Tag>[]): Observable<TagInteraction> => {
                    return observableFrom(tags).pipe(
                        mergeMap(
                            (tag: RenderTag<Tag>): Observable<TagInteraction> => {
                                return tag.interact$;
                            }));
                }),
            switchMap(
                (interaction: TagInteraction): Observable<TagInteraction> => {
                    return observableConcat(
                        observableOf(interaction),
                        this._container.mouseService.documentMouseUp$.pipe(
                            map(
                                (): TagInteraction => {
                                    return { offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: null };
                                }),
                            first()));
                }),
            share());

        const mouseMove$: Observable<MouseEvent> = observableMerge(
            this._container.mouseService.mouseMove$,
            this._container.mouseService.domMouseMove$).pipe(
                share());

        this._claimMouseSubscription = interaction$.pipe(
            switchMap(
                (interaction: TagInteraction): Observable<MouseEvent> => {
                    return !!interaction.tag ? this._container.mouseService.domMouseDragStart$ : observableEmpty();
                }))
            .subscribe(
                (): void => {
                    this._container.mouseService.claimMouse(this._name, 3);
                });

        this._cursorSubscription = interaction$.pipe(
            map(
                (interaction: TagInteraction): string => {
                    return interaction.cursor;
                }),
            distinctUntilChanged())
            .subscribe(
                (cursor: string): void => {
                    const interactionCursors: InteractionCursor[] = ["crosshair", "move", "nesw-resize", "nwse-resize"];
                    for (const interactionCursor of interactionCursors) {
                        this._container.container.classList.remove(`component-tag-edit-${interactionCursor}`);
                    }

                    if (!!cursor) {
                        this._container.container.classList.add(`component-tag-edit-${cursor}`);
                    }
                });

        this._unclaimMouseSubscription = this._container.mouseService
            .filtered$(this._name, this._container.mouseService.domMouseDragEnd$)
            .subscribe(
                (e: MouseEvent): void => {
                    this._container.mouseService.unclaimMouse(this._name);
                });

        this._preventDefaultSubscription = interaction$.pipe(
            switchMap(
                (interaction: TagInteraction): Observable<MouseEvent> => {
                    return !!interaction.tag ?
                        this._container.mouseService.documentMouseMove$ :
                        observableEmpty();
                }))
            .subscribe(
                (event: MouseEvent): void => {
                    event.preventDefault(); // prevent selection of content outside the viewer
                });

        this._updateGeometrySubscription = interaction$.pipe(
            switchMap(
                (interaction: TagInteraction): Observable<[MouseEvent, RenderCamera, TagInteraction, Transform]> => {
                    if (interaction.operation === TagOperation.None || !interaction.tag) {
                        return observableEmpty();
                    }

                    const mouseDrag$: Observable<MouseEvent> =
                        this._container.mouseService
                            .filtered$(
                                this._name,
                                this._container.mouseService.domMouseDrag$).pipe(
                                    filter(
                                        (event: MouseEvent): boolean => {
                                            return this._viewportCoords.insideElement(event, this._container.container);
                                        }));

                    return observableCombineLatest(
                        mouseDrag$,
                        this._container.renderService.renderCamera$).pipe(
                            withLatestFrom(
                                observableOf(interaction),
                                this._navigator.stateService.currentTransform$,
                                (
                                    [event, render]: [MouseEvent, RenderCamera],
                                    i: TagInteraction,
                                    transform: Transform):
                                    [MouseEvent, RenderCamera, TagInteraction, Transform] => {
                                    return [event, render, i, transform];
                                }));
                }))
            .subscribe(
                ([mouseEvent, renderCamera, interaction, transform]: [MouseEvent, RenderCamera, TagInteraction, Transform]): void => {
                    const basic: number[] = this._mouseEventToBasic(
                        mouseEvent,
                        this._container.container,
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
        this._cursorSubscription.unsubscribe();
        this._preventDefaultSubscription.unsubscribe();
        this._unclaimMouseSubscription.unsubscribe();
        this._updateGeometrySubscription.unsubscribe();
    }

    protected _getNameExtension(): string {
        return "edit-vertex";
    }
}
