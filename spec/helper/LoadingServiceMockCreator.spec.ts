import { Subject } from "rxjs";
import { LoadingService } from "../../src/viewer/LoadingService";

import { MockCreator } from "./MockCreator.spec";
import { MockCreatorBase } from "./MockCreatorBase.spec";

export class LoadingServiceMockCreator extends MockCreatorBase<LoadingService> {
    public create(): LoadingService {
        const mock: LoadingService = new MockCreator().create(LoadingService, "LoadingService");

        this._mockProperty(mock, "loading$", new Subject<boolean>());

        return mock;
    }
}
