import {Subject} from "rxjs";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";

import { Transform } from "../../src/geo/Transform";
import Node from "../../src/graph/Node";
import { PanService } from "../../src/viewer/PanService";

export class PanServiceMockCreator extends MockCreatorBase<PanService> {
    public create(): PanService {
        const mock: PanService = new MockCreator().create(PanService, "PanService");

        this._mockProperty(mock, "panNodes$", new Subject<[Node, Transform]>());

        return mock;
    }
}

export default PanServiceMockCreator;
