import {ICurrentState2} from "../../State";
import {Node} from "../../Graph";

export interface IStateContext extends ICurrentState2 {
    update(): void;
    append(nodes: Node[]): void;
    remove(n: number): void;
    cut(): void;
    set(nodes: Node[]): void;
}
