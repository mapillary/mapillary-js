import {
    CreateVertexHandler,
    OutlineCreateTag,
    PolygonGeometry,
} from "../../../Component";
import {Transform} from "../../../Geo";

export class CreatePolygonHandler extends CreateVertexHandler {
    protected _setVertex2d(tag: OutlineCreateTag, basicPoint: number[], transform: Transform): void {
        tag.geometry.setVertex2d((<PolygonGeometry>tag.geometry).polygon.length - 2, basicPoint, transform);
    }
}

export default CreatePolygonHandler;
