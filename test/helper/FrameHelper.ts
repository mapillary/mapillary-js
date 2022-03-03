import { ImageHelper } from "./ImageHelper";
import { TransformHelper } from "./TransformHelper";

import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { State } from "../../src/state/State";
import { Camera } from "../../src/geo/Camera";
import { CameraType } from "../../src/geo/interfaces/CameraType";

export class FrameHelper {
    private _imageHelper: ImageHelper = new ImageHelper();
    private _transformHelper: TransformHelper = new TransformHelper();

    public createFrame(
        cameraType: CameraType = "perspective"): AnimationFrame {

        const currentImage =
            this._imageHelper.createImage(cameraType);
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
                currentImage: currentImage,
                currentTransform: currentTransform,
                lastImage: currentImage,
                motionless: false,
                imagesAhead: 0,
                previousCamera: null,
                previousImage: undefined,
                previousTransform: undefined,
                reference: { alt: 0, lat: 0, lng: 0 },
                state: State.Traversing,
                stateTransitionAlpha: 0,
                trajectory: [currentImage],
                zoom: 0,
            },
        };
    }
}
