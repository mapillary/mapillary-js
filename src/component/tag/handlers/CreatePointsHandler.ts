import { Subject } from "rxjs";
import { Transform } from "../../../geo/Transform";
import { ExtremePointCreateTag } from "../tag/ExtremePointCreateTag";
import { CreateVertexHandler } from "./CreateVertexHandler";

export class CreatePointsHandler extends CreateVertexHandler {
    protected get _create$(): Subject<number[]> {
        return this._tagCreator.createPoints$;
    }

    protected _addPoint(tag: ExtremePointCreateTag, basicPoint: number[]): void {
        tag.geometry.addPoint2d(basicPoint);
    }

    protected _getNameExtension(): string {
        return "create-points";
    }

    protected _setVertex2d(tag: ExtremePointCreateTag, basicPoint: number[], transform: Transform): void {
        tag.geometry.setPoint2d((tag.geometry).points.length - 1, basicPoint, transform);
    }
}
