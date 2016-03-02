import {ICurrentState, IRotation} from "../../State";
import {Node} from "../../Graph";

export interface IStateContext extends ICurrentState {
    traverse(): void;
    wait(): void;

    update(): void;
    append(nodes: Node[]): void;
    prepend(nodes: Node[]): void;
    remove(n: number): void;
    cut(): void;
    set(nodes: Node[]): void;

    rotate(delta: IRotation): void;
    move(delta: number): void;
}
