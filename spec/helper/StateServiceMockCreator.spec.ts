/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";

import {ILatLonAlt} from "../../src/Geo";
import {Node} from "../../src/Graph";
import {IFrame, StateService} from "../../src/State";

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

        let currentState$: Subject<IFrame> = new Subject<IFrame>();
        Object.defineProperty(
            mock,
            "currentState$",
            {
                get: (): Subject<IFrame> => { return currentState$; },
                set: (value: Subject<IFrame>): void => { currentState$ = value; },
            });

        let reference$: Subject<ILatLonAlt> = new Subject<ILatLonAlt>();
        Object.defineProperty(
            mock,
            "reference$",
            {
                get: (): Subject<ILatLonAlt> => { return reference$; },
                set: (value: Subject<ILatLonAlt>): void => { reference$ = value; },
            });

        return mock;
    }
}

export default StateServiceMockCreator;
