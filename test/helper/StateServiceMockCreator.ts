import { Subject } from "rxjs";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

import { Image } from "../../src/graph/Image";
import { Transform } from "stream";
import { LngLatAlt } from "../../src/api/interfaces/LngLatAlt";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { State } from "../../src/state/State";
import { StateService } from "../../src/state/StateService";

export class StateServiceMockCreator extends MockCreatorBase<StateService> {
    public create(): StateService {
        const mock: StateService = new MockCreator().create(StateService, "StateService");

        this._mockProperty(mock, "currentCamera$", new Subject<Image>());
        this._mockProperty(mock, "currentId$", new Subject<Image>());
        this._mockProperty(mock, "currentImage$", new Subject<Image>());
        this._mockProperty(mock, "currentImageExternal$", new Subject<Image>());
        this._mockProperty(mock, "currentState$", new Subject<AnimationFrame>());
        this._mockProperty(mock, "currentTransform$", new Subject<Transform>());
        this._mockProperty(mock, "inMotion$", new Subject<boolean>());
        this._mockProperty(mock, "inTranslation$", new Subject<boolean>());
        this._mockProperty(mock, "reference$", new Subject<LngLatAlt>());
        this._mockProperty(mock, "state$", new Subject<State>());

        return mock;
    }
}
