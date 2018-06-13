import {Subject} from "rxjs";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";
import {
    LoadingService,
} from "../../src/Viewer";

export class LoadingServiceMockCreator extends MockCreatorBase<LoadingService> {
    public create(): LoadingService {
        const mock: LoadingService = new MockCreator().create(LoadingService, "LoadingService");

        this._mockProperty(mock, "loading$", new Subject<boolean>());

        return mock;
    }
}

export default LoadingServiceMockCreator;
