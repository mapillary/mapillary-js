import { NodeHelper } from "./NodeHelper";
import { Transform } from "../../src/geo/Transform";
import { CameraType } from "../../src/geo/interfaces/CameraType";

export class TransformHelper {
    private _nodeHelper: NodeHelper = new NodeHelper();

    public createTransform(
        cameraType: CameraType = "perspective"): Transform {

        const node = this._nodeHelper
            .createNode(cameraType);

        return new Transform(
            node.orientation,
            node.width,
            node.height,
            node.scale,
            node.rotation,
            [0, 0, 0],
            null,
            null,
            node.cameraParameters,
            cameraType);
    }
}
