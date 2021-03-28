import { Image as MImage } from "../../src/graph/Image";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

export class ImageMockCreator extends MockCreatorBase<MImage> {
    public create(configuration?: { [key: string]: any }): MImage {
        const mock: MImage = new MockCreator().create(MImage, "Image");

        this._mockProperty(
            mock, "image",
            configuration.image ?? new Image());
        this._mockProperty(
            mock, "key",
            configuration.key ?? "key");

        return mock;
    }
}
