import { NodeHelper } from "./NodeHelper";
import { TransformHelper } from "./TransformHelper";

import { IFrame } from "../../src/state/interfaces/IFrame";
import { State } from "../../src/state/State";
import { Camera } from "../../src/geo/Camera";
import { CameraProjectionType } from "../../src/api/interfaces/CameraProjectionType";

export class FrameHelper {
    private _nodeHelper: NodeHelper = new NodeHelper();
    private _transformHelper: TransformHelper = new TransformHelper();

    public createFrame(
        cameraType: CameraProjectionType = "perspective"): IFrame {

        const currentNode =
            this._nodeHelper.createNode(cameraType);
        const currentTransform =
            this._transformHelper.createTransform(cameraType);

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
