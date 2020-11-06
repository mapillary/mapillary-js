import { Subject } from "rxjs";

import { GraphServiceMockCreator } from "./GraphServiceMockCreator.spec";
import { LoadingServiceMockCreator } from "./LoadingServiceMockCreator.spec";
import { MockCreator } from "./MockCreator.spec";
import { MockCreatorBase } from "./MockCreatorBase.spec";
import { PanServiceMockCreator } from "./PanServiceMockCreator.spec";
import { PlayServiceMockCreator } from "./PlayServiceMockCreator.spec";
import { StateServiceMockCreator } from "./StateServiceMockCreator.spec";

import {
    CacheService,
    Navigator,
} from "../../src/Viewer";
import API from "../../src/api/API";

export class NavigatorMockCreator extends MockCreatorBase<Navigator> {
    public create(): Navigator {
        const mock: Navigator = new MockCreator().create(Navigator, "Navigator");

        this._mockProperty(mock, "api", new MockCreator().create(API, "API"));
        this._mockProperty(mock, "cacheService", new MockCreator().create(CacheService, "CacheService"));
        this._mockProperty(mock, "graphService", new GraphServiceMockCreator().create());
        this._mockProperty(mock, "loadingService", new LoadingServiceMockCreator().create());
        this._mockProperty(mock, "movedToKey$", new Subject<string>());
        this._mockProperty(mock, "panService", new PanServiceMockCreator().create());
        this._mockProperty(mock, "playService", new PlayServiceMockCreator().create());
        this._mockProperty(mock, "stateService", new StateServiceMockCreator().create());

        return mock;
    }
}

export default NavigatorMockCreator;
