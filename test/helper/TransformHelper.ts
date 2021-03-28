import { ImageHelper } from "./ImageHelper";
import { Transform } from "../../src/geo/Transform";
import { CameraType } from "../../src/geo/interfaces/CameraType";

export class TransformHelper {
    private _imageHelper: ImageHelper = new ImageHelper();

    public createTransform(
        cameraType: CameraType = "perspective"): Transform {

        const image = this._imageHelper
            .createImage(cameraType);

        return new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            [0, 0, 0],
            null,
            null,
            image.cameraParameters,
            cameraType);
    }
}
