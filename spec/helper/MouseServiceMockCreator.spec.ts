/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {
    MouseService,
} from "../../src/Viewer";

export class MouseServiceMockCreator extends MockCreator {
    public createMock(): MouseService {
        let mock: MouseService = super.createMock(MouseService, "MouseService");

        this._mockProperty(mock, "mouseMove$", new Subject<MouseEvent>());
        this._mockProperty(mock, "active$", new Subject<boolean>());

        return mock;
    }
}

export default MouseServiceMockCreator;
