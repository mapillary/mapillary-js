import { NodeHelper } from "./NodeHelper";
import { Transform } from "../../src/geo/Transform";
import { CameraProjectionType } from "../../src/api/interfaces/CameraProjectionType";

export class TransformHelper {
    private _nodeHelper: NodeHelper = new NodeHelper();

    public createTransform(
        cameraType: CameraProjectionType = "perspective"): Transform {

        const node = this._nodeHelper
            .createNode(cameraType);

        return new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.rotation,
            [0, 0, 0],
            null,
            null,
            null,
            null,
            cameraType);
    }
}
