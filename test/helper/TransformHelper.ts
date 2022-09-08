import { ImageHelper } from "./ImageHelper";
import { Transform } from "../../src/geo/Transform";
import { CameraType } from "../../src/geo/interfaces/CameraType";
import { ProjectionService } from "../../src/viewer/ProjectionService";

export class TransformHelper {
    private _imageHelper: ImageHelper = new ImageHelper();

    public createTransform(
        cameraType: CameraType = "perspective"): Transform {

        const image = this._imageHelper
            .createImage(cameraType);
        const camera = new ProjectionService()
            .makeCamera(cameraType, image.cameraParameters);

        return new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            [0, 0, 0],
            null,
            camera);
    }
}
