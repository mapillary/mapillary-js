import { IStateBase } from "./interfaces/IStateBase";
import { State } from "./State";
import { CustomState } from "./state/CustomState";
import { EarthState } from "./state/EarthState";
import { InteractiveWaitingState } from "./state/InteractiveWaitingState";
import { StateBase } from "./state/StateBase";
import { TraversingState } from "./state/TraversingState";
import { WaitingState } from "./state/WaitingState";

type StateCreators = Map<string, new (state: IStateBase) => StateBase>;

export class StateTransitionMatrix {
    private readonly _creators: StateCreators;
    private readonly _transitions: Map<string, string[]>;

    constructor() {
        const custom = State[State.Custom];
        const earth = State[State.Earth];
        const traverse = State[State.Traversing];
        const wait = State[State.Waiting];
        const waitInteractively = State[State.WaitingInteractively];

        this._creators = new Map();
        const creator = this._creators;
        creator.set(custom, CustomState);
        creator.set(earth, EarthState);
        creator.set(traverse, TraversingState);
        creator.set(wait, WaitingState);
        creator.set(waitInteractively, InteractiveWaitingState);

        this._transitions = new Map();
        const transitions = this._transitions;
        transitions.set(custom, [earth, traverse]);
        transitions.set(earth, [custom, traverse]);
        transitions.set(traverse, [custom, earth, wait, waitInteractively]);
        transitions.set(wait, [traverse, waitInteractively]);
        transitions.set(waitInteractively, [traverse, wait]);
    }

    public getState(state: StateBase): State {
        if (state instanceof CustomState) {
            return State.Custom;
        } else if (state instanceof EarthState) {
            return State.Earth;
        } else if (state instanceof TraversingState) {
            return State.Traversing;
        } else if (state instanceof WaitingState) {
            return State.Waiting;
        } else if (state instanceof InteractiveWaitingState) {
            return State.WaitingInteractively;
        }
        throw new Error("Invalid state instance");
    }

    public generate(state: State, options: IStateBase): StateBase {
        const concreteState = this._creators.get(State[state]);
        return new concreteState(options);
    }

    public transition(state: StateBase, to: State): StateBase {
        if (!this.validate(state, to)) {
            throw new Error("Invalid transition");
        }
        return this.generate(to, state);
    }

    public validate(state: StateBase, to: State): boolean {
        const source = State[this.getState(state)];
        const target = State[to];
        const transitions = this._transitions;

        return transitions.has(source) &&
            transitions.get(source).includes(target);
    }
}
