import {ICurrentState2} from "../../State";
import {Node} from "../../Graph";

export interface IStateContext extends ICurrentState2 {
    update(): void;
    append(nodes: Node[]): void;
    set(nodes: Node[]): void;
}
