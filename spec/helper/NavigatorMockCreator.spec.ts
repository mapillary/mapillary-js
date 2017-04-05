/// <reference path="../../typings/index.d.ts" />

import {MockCreator} from "./MockCreator.spec";
import {LoadingServiceMockCreator} from "./LoadingServiceMockCreator.spec";
import {StateServiceMockCreator} from "./StateServiceMockCreator.spec";

import {APIv3} from "../../src/API";
import {Navigator} from "../../src/Viewer";

export class NavigatorMockCreator extends MockCreator {
    public createMock(): Navigator {
        let mock: Navigator = super.createMock(Navigator, "Navigator");

        this._mockProperty(mock, "apiV3", super.createMock(APIv3, "APIv3"));
        this._mockProperty(mock, "loadingService", new LoadingServiceMockCreator().createMock());
        this._mockProperty(mock, "stateService", new StateServiceMockCreator().createMock());

        return mock;
    }
}

export default NavigatorMockCreator;
