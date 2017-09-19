import {
    CreateVertexHandler,
    OutlineCreateTag,
} from "../../../Component";
import {Transform} from "../../../Geo";

export class CreateRectHandler extends CreateVertexHandler {
    protected _setVertex2d(tag: OutlineCreateTag, basicPoint: number[], transform: Transform): void {
        tag.geometry.setVertex2d(3, basicPoint, transform);
    }
}

export default CreateRectHandler;
