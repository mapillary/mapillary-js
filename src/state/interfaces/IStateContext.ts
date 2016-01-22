import {ICurrentState, IRotationDelta} from "../../State";
import {Node} from "../../Graph";

export interface IStateContext extends ICurrentState {
    update(): void;
    append(nodes: Node[]): void;
    remove(n: number): void;
    cut(): void;
    set(nodes: Node[]): void;

    rotate(delta: IRotationDelta): void;
}
