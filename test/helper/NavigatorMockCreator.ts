import { Subject } from "rxjs";

import { GraphServiceMockCreator } from "./GraphServiceMockCreator";
import { LoadingServiceMockCreator } from "./LoadingServiceMockCreator";
import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";
import { PanServiceMockCreator } from "./PanServiceMockCreator";
import { PlayServiceMockCreator } from "./PlayServiceMockCreator";
import { StateServiceMockCreator } from "./StateServiceMockCreator";

import { Navigator } from "../../src/viewer/Navigator";
import { APIWrapper } from "../../src/api/APIWrapper";
import { CacheService } from "../../src/viewer/CacheService";

export class NavigatorMockCreator extends MockCreatorBase<Navigator> {
    public create(): Navigator {
        const mock: Navigator = new MockCreator().create(Navigator, "Navigator");

        this._mockProperty(mock, "api", new MockCreator().create(APIWrapper, "APIWrapper"));
        this._mockProperty(mock, "cacheService", new MockCreator().create(CacheService, "CacheService"));
        this._mockProperty(mock, "graphService", new GraphServiceMockCreator().create());
        this._mockProperty(mock, "loadingService", new LoadingServiceMockCreator().create());
        this._mockProperty(mock, "movedToId$", new Subject<string>());
        this._mockProperty(mock, "panService", new PanServiceMockCreator().create());
        this._mockProperty(mock, "playService", new PlayServiceMockCreator().create());
        this._mockProperty(mock, "stateService", new StateServiceMockCreator().create());

        return mock;
    }
}
