import { bootstrap } from "../Bootstrap";
bootstrap();

import { StateTransitionMatrix } from "../../src/state/StateTransitionMatrix";
import { State } from "../../src/state/State";
import { TraversingState } from "../../src/state/state/TraversingState";
import { generateStateParams } from "../helper/StateHelper";
import { EarthState } from "../../src/state/state/EarthState";
import { CustomState } from "../../src/state/state/CustomState";
import { WaitingState } from "../../src/state/state/WaitingState";
import { InteractiveWaitingState } from "../../src/state/state/InteractiveWaitingState";



describe("StateTransitionMatrix.ctor", () => {
    it("should be contructed", () => {
        const matrix = new StateTransitionMatrix();
        expect(matrix).toBeDefined();
    });
});

describe("StateTransitionMatrix.getState", () => {
    it("should return correct state", () => {
        const matrix = new StateTransitionMatrix();

        const custom = matrix.getState(
            new CustomState(generateStateParams()));
        expect(custom).toBe(State.Custom);

        const earth = matrix.getState(
            new EarthState(generateStateParams()));
        expect(earth).toBe(State.Earth);

        const traversing = matrix.getState(
            new TraversingState(generateStateParams()));
        expect(traversing).toBe(State.Traversing);

        const waiting = matrix.getState(
            new WaitingState(generateStateParams()));
        expect(waiting).toBe(State.Waiting);

        const waitingInteractively = matrix.getState(
            new InteractiveWaitingState(generateStateParams()));
        expect(waitingInteractively).toBe(State.WaitingInteractively);
    });
});

describe("StateTransitionMatrix.validate", () => {
    it("should only validate valid transitions", () => {
        const matrix = new StateTransitionMatrix();

        const custom = new CustomState(generateStateParams());
        expect(matrix.validate(custom, State.Custom)).toBe(false);
        expect(matrix.validate(custom, State.Earth)).toBe(true);
        expect(matrix.validate(custom, State.Traversing)).toBe(true);
        expect(matrix.validate(custom, State.Waiting)).toBe(false);
        expect(matrix.validate(custom, State.WaitingInteractively)).toBe(false);

        const earth = new EarthState(generateStateParams());
        expect(matrix.validate(earth, State.Custom)).toBe(true);
        expect(matrix.validate(earth, State.Earth)).toBe(false);
        expect(matrix.validate(earth, State.Traversing)).toBe(true);
        expect(matrix.validate(earth, State.Waiting)).toBe(false);
        expect(matrix.validate(earth, State.WaitingInteractively)).toBe(false);

        const traversing = new TraversingState(generateStateParams());
        expect(matrix.validate(traversing, State.Custom)).toBe(true);
        expect(matrix.validate(traversing, State.Earth)).toBe(true);
        expect(matrix.validate(traversing, State.Traversing)).toBe(false);
        expect(matrix.validate(traversing, State.Waiting)).toBe(true);
        expect(matrix.validate(traversing, State.WaitingInteractively))
            .toBe(true);

        const waiting = new WaitingState(generateStateParams());
        expect(matrix.validate(waiting, State.Custom)).toBe(false);
        expect(matrix.validate(waiting, State.Earth)).toBe(false);
        expect(matrix.validate(waiting, State.Traversing)).toBe(true);
        expect(matrix.validate(waiting, State.Waiting)).toBe(false);
        expect(matrix.validate(waiting, State.WaitingInteractively)).toBe(true);

        const waitingInteractively =
            new InteractiveWaitingState(generateStateParams());
        expect(matrix.validate(waitingInteractively, State.Custom))
            .toBe(false);
        expect(matrix.validate(waitingInteractively, State.Earth))
            .toBe(false);
        expect(matrix.validate(waitingInteractively, State.Traversing))
            .toBe(true);
        expect(matrix.validate(waitingInteractively, State.Waiting))
            .toBe(true);
        expect(
            matrix
                .validate(
                    waitingInteractively,
                    State.WaitingInteractively))
            .toBe(false);
    });
});

describe("StateTransitionMatrix.generate", () => {
    it("should generate concrete state instances", () => {
        const matrix = new StateTransitionMatrix();

        expect(
            matrix
                .generate(
                    State.Custom,
                    generateStateParams()))
            .toBeInstanceOf(CustomState);

        expect(
            matrix
                .generate(
                    State.Earth,
                    generateStateParams()))
            .toBeInstanceOf(EarthState);

        expect(
            matrix
                .generate(
                    State.Traversing,
                    generateStateParams()))
            .toBeInstanceOf(TraversingState);

        expect(
            matrix
                .generate(
                    State.Waiting,
                    generateStateParams()))
            .toBeInstanceOf(WaitingState);

        expect(
            matrix
                .generate(
                    State.WaitingInteractively,
                    generateStateParams()))
            .toBeInstanceOf(InteractiveWaitingState);
    });
});

describe("StateTransitionMatrix.transition", () => {
    it("should transition", () => {
        const matrix = new StateTransitionMatrix();
        const state = new CustomState(generateStateParams());
        const transitioned = matrix.transition(state, State.Earth);

        expect(transitioned).toBeInstanceOf(EarthState);
    });

    it("should throw if transition is not valid", () => {
        const matrix = new StateTransitionMatrix();
        const state = new CustomState(generateStateParams());

        expect(() => { matrix.transition(state, State.Waiting); }).toThrow();
    });
});
