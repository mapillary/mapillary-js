/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";

import {
    ILatLonAlt,
    Transform,
} from "../../src/Geo";
import {Node} from "../../src/Graph";
import {IFrame, StateService} from "../../src/State";

export class StateServiceMockCreator extends MockCreator {
    public createMock(): StateService {
        let mock: StateService = super.createMock(StateService, "StateService");

        this._mockProperty(mock, "currentNode$", new Subject<Node>());
        this._mockProperty(mock, "currentState$", new Subject<IFrame>());
        this._mockProperty(mock, "currentTransform$", new Subject<Transform>());
        this._mockProperty(mock, "reference$", new Subject<ILatLonAlt>());

        return mock;
    }
}

export default StateServiceMockCreator;
