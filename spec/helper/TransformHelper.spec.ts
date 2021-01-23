import { NodeHelper } from "./NodeHelper.spec";

import { Node } from "../../src/graph/Node";
import { Transform } from "../../src/geo/Transform";
import { IGPano } from "../../src/api/interfaces/IGPano";

export class TransformHelper {
    private _nodeHelper: NodeHelper = new NodeHelper();

    public createTransform(gpano?: IGPano): Transform {
        let node: Node = this._nodeHelper.createNode(gpano);

        return new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            [0, 0, 0],
            null);
    }

    public createFullGPano(): IGPano {
        return {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };
    }
}
