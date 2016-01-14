import {ICurrentState} from "../../State";
import {Node} from "../../Graph";

export interface IStateContext extends ICurrentState {
    update(): void;
    append(nodes: Node[]): void;
    remove(n: number): void;
    cut(): void;
    set(nodes: Node[]): void;
}
