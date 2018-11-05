import {NodeHelper} from "./NodeHelper.spec";
import {TransformHelper} from "./TransformHelper.spec";

import {IGPano} from "../../src/API";
import {Transform, Camera} from "../../src/Geo";
import {Node} from "../../src/Graph";
import {IFrame, State} from "../../src/State";

export class FrameHelper {
    private _nodeHelper: NodeHelper = new NodeHelper();
    private _transformHelper: TransformHelper = new TransformHelper();

    public createFrame(gpano?: IGPano): IFrame {
        const currentNode: Node = this._nodeHelper.createNode(gpano);
        const currentTransform: Transform = this._transformHelper.createTransform(gpano);

        return {
            fps: 60,
            id: 0,
            state: {
                alpha: 0,
                camera: new Camera(),
                currentCamera: new Camera(),
                currentIndex: 0,
                currentNode: currentNode,
                currentTransform: currentTransform,
                lastNode: currentNode,
                motionless: false,
                nodesAhead: 0,
                previousNode: undefined,
                previousTransform: undefined,
                reference: { alt: 0, lat: 0, lon: 0 },
                state: State.Traversing,
                trajectory: [currentNode],
                zoom: 0,
            },
        };
    }
}

export default TransformHelper;
