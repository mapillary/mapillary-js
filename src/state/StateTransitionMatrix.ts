import { IStateBase } from "./interfaces/IStateBase";
import { State } from "./State";
import { EarthState } from "./state/EarthState";
import { InteractiveWaitingState } from "./state/InteractiveWaitingState";
import { StateBase } from "./state/StateBase";
import { TraversingState } from "./state/TraversingState";
import { WaitingState } from "./state/WaitingState";

type StateCreators = Map<string, new (state: StateBase) => StateBase>;

export class StateTransitionMatrix {
    private readonly _creators: StateCreators;
    private readonly _transitions: Map<string, string[]>;

    constructor() {
        const earth = State[State.Earth];
        const traverse = State[State.Traversing];
        const wait = State[State.Waiting];
        const waitInteractively = State[State.WaitingInteractively];

        this._creators = new Map();
        const creator = this._creators;
        creator.set(earth, EarthState);
        creator.set(traverse, TraversingState);
        creator.set(wait, WaitingState);
        creator.set(waitInteractively, InteractiveWaitingState);

        this._transitions = new Map();
        const transitions = this._transitions;
        transitions.set(earth, [traverse, wait, waitInteractively]);
        transitions.set(traverse, [earth, wait, waitInteractively]);
        transitions.set(wait, [traverse, waitInteractively]);
        transitions.set(waitInteractively, [traverse, wait]);
    }

    public getState(state: StateBase): State {
        if (state instanceof EarthState) {
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

    public initialize(state: IStateBase): StateBase {
        return new TraversingState(state);
    }

    public transition(state: StateBase, to: State): StateBase {
        const source = State[this.getState(state)];
        const target = State[to];
        const transitions = this._transitions;

        if (!transitions.has(source) ||
            !transitions.get(source).includes(target)) {
            throw new Error("Invalid transition");
        }

        const stateImplementation = this._creators.get(target);
        return new stateImplementation(state);
    }
}
