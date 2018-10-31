import {Subject} from "rxjs";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";
import {
    KeyboardService,
} from "../../src/Viewer";

export class KeyboardServiceMockCreator extends MockCreatorBase<KeyboardService> {
    public create(): KeyboardService {
        const mock: KeyboardService = new MockCreator().create(KeyboardService, "KeyboardService");

        this._mockProperty(mock, "keyDown$", new Subject<KeyboardEvent>());
        this._mockProperty(mock, "keyUp$", new Subject<KeyboardEvent>());

        return mock;
    }
}

export default KeyboardServiceMockCreator;
