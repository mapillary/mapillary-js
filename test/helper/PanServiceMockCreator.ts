import { Subject } from "rxjs";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

import { Transform } from "../../src/geo/Transform";
import { Image } from "../../src/graph/Image";
import { PanService } from "../../src/viewer/PanService";

export class PanServiceMockCreator extends MockCreatorBase<PanService> {
    public create(): PanService {
        const mock: PanService =
            new MockCreator().create(PanService, "PanService");

        this._mockProperty(
            mock,
            "panImages$",
            new Subject<[Image, Transform]>());

        return mock;
    }
}
