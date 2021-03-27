import { Subject } from "rxjs";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

import { Node } from "../../src/graph/Node";
import { Transform } from "stream";
import { LatLonAlt } from "../../src/api/interfaces/LatLonAlt";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { State } from "../../src/state/State";
import { StateService } from "../../src/state/StateService";

export class StateServiceMockCreator extends MockCreatorBase<StateService> {
    public create(): StateService {
        const mock: StateService = new MockCreator().create(StateService, "StateService");

        this._mockProperty(mock, "currentCamera$", new Subject<Node>());
        this._mockProperty(mock, "currentId$", new Subject<Node>());
        this._mockProperty(mock, "currentNode$", new Subject<Node>());
        this._mockProperty(mock, "currentNodeExternal$", new Subject<Node>());
        this._mockProperty(mock, "currentState$", new Subject<AnimationFrame>());
        this._mockProperty(mock, "currentTransform$", new Subject<Transform>());
        this._mockProperty(mock, "inMotion$", new Subject<boolean>());
        this._mockProperty(mock, "inTranslation$", new Subject<boolean>());
        this._mockProperty(mock, "reference$", new Subject<LatLonAlt>());
        this._mockProperty(mock, "state$", new Subject<State>());

        return mock;
    }
}
