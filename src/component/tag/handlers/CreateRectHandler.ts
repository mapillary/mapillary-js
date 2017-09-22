import {Subject} from "rxjs/Subject";

import {
    CreateVertexHandler,
    OutlineCreateTag,
} from "../../../Component";
import {Transform} from "../../../Geo";

export class CreateRectHandler extends CreateVertexHandler {
    protected get _create$(): Subject<number[]> {
        return this._tagCreator.createRect$;
    }

    protected _setVertex2d(tag: OutlineCreateTag, basicPoint: number[], transform: Transform): void {
        tag.geometry.setVertex2d(3, basicPoint, transform);
    }
}

export default CreateRectHandler;
