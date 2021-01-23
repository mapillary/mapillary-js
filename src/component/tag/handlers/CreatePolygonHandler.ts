import { Subject } from "rxjs";
import { Transform } from "../../../geo/Transform";
import { PolygonGeometry } from "../geometry/PolygonGeometry";
import { OutlineCreateTag } from "../tag/OutlineCreateTag";
import { CreateVertexHandler } from "./CreateVertexHandler";

export class CreatePolygonHandler extends CreateVertexHandler {
    protected get _create$(): Subject<number[]> {
        return this._tagCreator.createPolygon$;
    }

    protected _addPoint(tag: OutlineCreateTag, basicPoint: number[]): void {
        tag.addPoint(basicPoint);
    }

    protected _getNameExtension(): string {
        return "create-polygon";
    }

    protected _setVertex2d(tag: OutlineCreateTag, basicPoint: number[], transform: Transform): void {
        tag.geometry.setVertex2d((<PolygonGeometry>tag.geometry).polygon.length - 2, basicPoint, transform);
    }
}
