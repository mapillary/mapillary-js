/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {
    RenderService,
    RenderCamera,
} from "../../src/Render";

export class RenderServiceMockCreator extends MockCreator {
    public createMock(): RenderService {
        let mock: RenderService = super.createMock(RenderService, "RenderService");

        this._mockProperty(mock, "renderCamera$", new Subject<RenderCamera>());

        return mock;
    }
}

export default RenderServiceMockCreator;
