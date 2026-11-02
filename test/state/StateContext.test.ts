import { bootstrap } from "../Bootstrap";
bootstrap();

import { ImageHelper } from "../helper/ImageHelper";
import { DataProvider } from "../helper/ProviderHelper";
import { generateStateParams } from "../helper/StateHelper";
import { TestImage } from "../helper/TestImage";
import { Camera } from "../../src/geo/Camera";
import { ImageCache } from "../../src/graph/ImageCache";
import { State } from "../../src/state/State";
import { StateContext } from "../../src/state/StateContext";
import { StateTransitionMatrix } from "../../src/state/StateTransitionMatrix";
import { TransitionMode } from "../../src/state/TransitionMode";
import { StateBase } from "../../src/state/state/StateBase";
import { ProjectionService } from "../../src/viewer/ProjectionService";

const modes = [
    State.Custom,
    State.Earth,
    State.GravityTraversing,
    State.Traversing,
    State.Waiting,
    State.WaitingInteractively,
];

const requests: { [state: number]: (context: StateContext) => void } = {
    [State.Custom]: (context: StateContext): void => { context.custom(); },
    [State.Earth]: (context: StateContext): void => { context.earth(); },
    [State.GravityTraversing]: (context: StateContext): void => { context.gravityTraverse(); },
    [State.Traversing]: (context: StateContext): void => { context.traverse(); },
    [State.Waiting]: (context: StateContext): void => { context.wait(); },
    [State.WaitingInteractively]: (context: StateContext): void => { context.waitInteractively(); },
};

const allowed: { [state: number]: State[] } = {
    [State.Custom]: [State.Earth, State.GravityTraversing, State.Traversing],
    [State.Earth]: [State.Custom, State.GravityTraversing, State.Traversing],
    [State.GravityTraversing]: [State.Custom, State.Earth, State.Traversing, State.Waiting, State.WaitingInteractively],
    [State.Traversing]: [State.Custom, State.Earth, State.GravityTraversing, State.Waiting, State.WaitingInteractively],
    [State.Waiting]: [State.GravityTraversing, State.Traversing, State.WaitingInteractively],
    [State.WaitingInteractively]: [State.GravityTraversing, State.Traversing, State.Waiting],
};

type ContextInternals = {
    _state: StateBase;
    _transitions: StateTransitionMatrix;
};

function internals(context: StateContext): ContextInternals {
    return context as unknown as ContextInternals;
}

function createContext(mode: State, transitionMode: TransitionMode): StateContext {
    const options = generateStateParams();
    options.alpha = 0.37;
    options.zoom = 1.5;
    options.currentIndex = 1;
    options.transitionMode = transitionMode;
    options.camera.position.fromArray([10, 20, 30]);
    options.camera.lookat.fromArray([11, 22, 37]);
    options.camera.up.fromArray([0, 0, 1]);
    options.reorientations = new Map();
    options.reorientations.set("current", { basic: [0.3, 0.7], forceOnReconstruction: true });
    options.trajectory = ["previous", "current"].map((id: string): TestImage => {
        const ent = new ImageHelper().createImageEnt();
        ent.id = id;
        ent.atomic_scale = 1;
        const image = new TestImage(ent);
        image.makeComplete(ent);
        image.mesh = { vertices: [], faces: [] };
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());
        return image;
    });
    const context = new StateContext(mode, options.geometry, transitionMode);
    const current = internals(context);
    current._state = current._transitions.generate(mode, options);
    context.rotate({ phi: 0.1, theta: 0.2 });
    context.setCenter([0.2, 0.7]);
    context.zoomTo(2.1);
    context.setSpeed(2);
    return context;
}

function cameraView(camera: Camera): number[][] {
    return [camera.position.toArray(), camera.lookat.toArray(), camera.up.toArray(), [camera.focal]];
}

function view(context: StateContext): unknown[] {
    return [
        cameraView(context.camera),
        cameraView(context.currentCamera),
        cameraView(context.previousCamera),
        context.getCenter(),
        context.zoom,
        context.alpha,
        context.stateTransitionAlpha,
        context.currentIndex,
        context.motionless,
        context.trajectory.slice(),
        { ...context.reference },
        Array.from(internals(context)._state.reorientations.entries()),
    ];
}

describe("StateContext same-state requests", () => {
    for (const mode of modes) {
        for (const transitionMode of [TransitionMode.Default, TransitionMode.Instantaneous]) {
            it(`should preserve ${State[mode]} in ${TransitionMode[transitionMode]} mode without warning or construction`, () => {
                const context = createContext(mode, transitionMode);
                const current = internals(context);
                const state = current._state;
                const properties = { ...state } as { [key: string]: unknown };
                const before = view(context);
                expect(current._transitions.validate(state, mode)).toBe(false);
                const validate = spyOn(current._transitions, "validate").and.callThrough();
                const transition = spyOn(current._transitions, "transition").and.callThrough();
                const generate = spyOn(current._transitions, "generate").and.callThrough();
                const warn = spyOn(console, "warn").and.stub();

                requests[mode](context);
                requests[mode](context);

                expect(warn).not.toHaveBeenCalled();
                expect(validate).not.toHaveBeenCalled();
                expect(transition).not.toHaveBeenCalled();
                expect(generate).not.toHaveBeenCalled();
                expect(context.state).toBe(mode);
                expect(current._state).toBe(state);
                const after = state as unknown as { [key: string]: unknown };
                expect(Object.keys(after)).toEqual(Object.keys(properties));
                for (const key of Object.keys(properties)) {
                    expect(after[key]).toBe(properties[key]);
                }
                expect(view(context)).toEqual(before);
            });
        }
    }

    it("should make repeated traverse requests harmless after a valid transition", () => {
        const context = createContext(State.Custom, TransitionMode.Default);
        const current = internals(context);
        const generate = spyOn(current._transitions, "generate").and.callThrough();
        const warn = spyOn(console, "warn").and.stub();
        context.traverse();
        const state = current._state;
        const before = view(context);

        for (let i = 0; i < 100; i++) {
            context.traverse();
        }

        expect(context.state).toBe(State.Traversing);
        expect(current._state).toBe(state);
        expect(view(context)).toEqual(before);
        expect(generate.calls.count()).toBe(1);
        expect(warn).not.toHaveBeenCalled();
    });
});

describe("StateContext different-state requests", () => {
    for (const from of modes) {
        for (const to of modes.filter((mode: State): boolean => mode !== from)) {
            const valid = allowed[from].includes(to);
            it(`should ${valid ? "perform" : "warn and reject"} ${State[from]} - ${State[to]}`, () => {
                const context = createContext(from, TransitionMode.Default);
                const current = internals(context);
                const state = current._state;
                const before = view(context);
                const transition = spyOn(current._transitions, "transition").and.callThrough();
                const generate = spyOn(current._transitions, "generate").and.callThrough();
                const warn = spyOn(console, "warn").and.stub();

                requests[to](context);

                if (valid) {
                    expect(context.state).toBe(to);
                    expect(current._state).not.toBe(state);
                    expect(transition.calls.count()).toBe(1);
                    expect(generate.calls.count()).toBe(1);
                    expect(warn).not.toHaveBeenCalled();
                    expect(current._state.reorientations).toBe(state.reorientations);
                    expect(context.trajectory).toEqual(state.trajectory);
                } else {
                    expect(context.state).toBe(from);
                    expect(current._state).toBe(state);
                    expect(view(context)).toEqual(before);
                    expect(transition).not.toHaveBeenCalled();
                    expect(generate).not.toHaveBeenCalled();
                    expect(warn.calls.count()).toBe(1);
                    expect(warn.calls.first().args).toEqual([
                        `Transition not valid (${State[from]} - ${State[to]})`,
                    ]);
                }
            });
        }
    }
});
