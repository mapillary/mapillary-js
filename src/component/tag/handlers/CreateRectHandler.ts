import {filter} from "rxjs/operators";
import {Subject, Subscription} from "rxjs";

import {
    CreateVertexHandler,
    OutlineCreateTag,
    RectGeometry,
} from "../../../Component";
import {Transform} from "../../../Geo";

export class CreateRectHandler extends CreateVertexHandler {
    private _initializeAnchorIndexingSubscription: Subscription;

    protected get _create$(): Subject<number[]> {
        return this._tagCreator.createRect$;
    }

    protected _addPoint(tag: OutlineCreateTag, basicPoint: number[]): void {
        const rectGeometry: RectGeometry = <RectGeometry>tag.geometry;
        if (!rectGeometry.validate(basicPoint)) {
            basicPoint = rectGeometry.getNonAdjustedVertex2d(3);
        }

        tag.addPoint(basicPoint);
    }

    protected _enable(): void {
        super._enable();

        this._initializeAnchorIndexingSubscription = this._tagCreator.tag$.pipe(
            filter(
                (tag: OutlineCreateTag): boolean => {
                    return !!tag;
                }))
            .subscribe(
                (tag: OutlineCreateTag): void => {
                    (<RectGeometry>tag.geometry).initializeAnchorIndexing();
                });
    }

    protected _disable(): void {
        super._disable();

        this._initializeAnchorIndexingSubscription.unsubscribe();
    }

    protected _getNameExtension(): string {
        return "create-rect";
    }

    protected _setVertex2d(tag: OutlineCreateTag, basicPoint: number[], transform: Transform): void {
        (<RectGeometry>tag.geometry).setOppositeVertex2d(basicPoint, transform);
    }
}

export default CreateRectHandler;
