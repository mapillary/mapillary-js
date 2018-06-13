import {Subject} from "rxjs";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";
import {
    ILoadStatus,
    ImageLoadingService,
    Node,
} from "../../src/Graph";

export class ImageLoadingServiceMockCreator extends MockCreatorBase<ImageLoadingService> {
    public create(): ImageLoadingService {
        const mock: ImageLoadingService = new MockCreator().create(ImageLoadingService, "ImageLoadingService");

        this._mockProperty(mock, "loadnode$", new Subject<Node>());
        this._mockProperty(mock, "loadstatus$", new Subject<{[key: string]: ILoadStatus}>());

        return mock;
    }
}

export default ImageLoadingServiceMockCreator;
