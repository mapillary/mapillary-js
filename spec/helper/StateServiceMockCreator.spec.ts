/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";

import {Node} from "../../src/Graph";
import {StateService} from "../../src/State";

export class StateServiceMockCreator extends MockCreator {
    public createMock(): StateService {
        let mock: StateService = super.createMock(StateService, "StateService");

        let currentNode$: Subject<Node> = new Subject<Node>();
        Object.defineProperty(
            mock,
            "currentNode$",
            {
                get: (): Subject<Node> => { return currentNode$; },
                set: (value: Subject<Node>): void => { currentNode$ = value; },
            });

        return mock;
    }
}

export default StateServiceMockCreator;
