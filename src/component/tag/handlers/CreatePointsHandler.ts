import { Subject } from "rxjs";

import {
    ExtremePointCreateTag,
    CreateVertexHandler,
} from "../../../Component";
import {Transform} from "../../../Geo";

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

export default CreatePointsHandler;
