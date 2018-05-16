import {NodeHelper} from "./NodeHelper.spec";

import {IGPano} from "../../src/API";
import {Transform} from "../../src/Geo";
import {Node} from "../../src/Graph";

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
}

export default TransformHelper;
