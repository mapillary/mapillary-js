/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {
    LoadingService,
} from "../../src/Viewer";

export class LoadingServiceMockCreator extends MockCreator {
    public createMock(): LoadingService {
        let mock: LoadingService = super.createMock(LoadingService, "LoadingService");

        this._mockProperty(mock, "loading$", new Subject<boolean>());

        return mock;
    }
}

export default LoadingServiceMockCreator;
