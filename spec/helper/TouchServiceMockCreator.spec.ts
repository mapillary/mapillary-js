/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {
    TouchService,
} from "../../src/Viewer";

export class TouchServiceMockCreator extends MockCreator {
    public createMock(): TouchService {
        let mock: TouchService = super.createMock(TouchService, "TouchService");

        this._mockProperty(mock, "doubleTap$", new Subject<TouchEvent>());

        return mock;
    }
}

export default TouchServiceMockCreator;
