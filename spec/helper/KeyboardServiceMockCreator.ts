import { Subject } from "rxjs";
import { KeyboardService } from "../../src/viewer/KeyboardService";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

export class KeyboardServiceMockCreator extends MockCreatorBase<KeyboardService> {
    public create(): KeyboardService {
        const mock: KeyboardService = new MockCreator().create(KeyboardService, "KeyboardService");

        this._mockProperty(mock, "keyDown$", new Subject<KeyboardEvent>());
        this._mockProperty(mock, "keyUp$", new Subject<KeyboardEvent>());

        return mock;
    }
}
