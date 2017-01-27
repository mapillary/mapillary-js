/// <reference path="../../typings/index.d.ts" />

import {MockCreator} from "./MockCreator.spec";
import {StateServiceMockCreator} from "./StateServiceMockCreator.spec";

import {APIv3} from "../../src/API";
import {StateService} from "../../src/State";
import {Navigator} from "../../src/Viewer";

export class NavigatorMockCreator extends MockCreator {
    public createMock(): Navigator {
        let mock: Navigator = super.createMock(Navigator, "Navigator");

        let stateServiceMockCreator: StateServiceMockCreator =
            new StateServiceMockCreator();
        let stateService: StateService = stateServiceMockCreator.createMock();
        Object.defineProperty(
            mock,
            "stateService",
            {
                get: (): StateService => { return stateService; },
                set: (value: StateService): void => { stateService = value; },
            });

        let apiV3: APIv3 = super.createMock(APIv3, "APIv3");
        Object.defineProperty(
            mock,
            "apiV3",
            {
                get: (): APIv3 => { return apiV3; },
                set: (value: APIv3): void => { apiV3 = value; },
            });

        return mock;
    }
}

export default NavigatorMockCreator;
