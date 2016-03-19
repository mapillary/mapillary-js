import {ICurrentState, IRotation, State} from "../../State";
import {Node} from "../../Graph";

export interface IStateContext extends ICurrentState {
    state: State;

    traverse(): void;
    wait(): void;

    update(fps: number): void;
    append(nodes: Node[]): void;
    prepend(nodes: Node[]): void;
    remove(n: number): void;
    cut(): void;
    set(nodes: Node[]): void;

    rotate(delta: IRotation): void;
    move(delta: number): void;
    moveTo(position: number): void;
}
