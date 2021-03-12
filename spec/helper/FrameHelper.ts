import { NodeHelper } from "./NodeHelper";
import { TransformHelper } from "./TransformHelper";

import { Node } from "../../src/graph/Node";
import { Transform } from "../../src/geo/Transform";
import { IGPano } from "../../src/api/interfaces/IGPano";
import { IFrame } from "../../src/state/interfaces/IFrame";
import { State } from "../../src/state/State";
import { Camera } from "../../src/geo/Camera";

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
