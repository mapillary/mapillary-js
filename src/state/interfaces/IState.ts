import {Node} from "../../Graph";

export interface IState {
    alpha: number;
    currentNode: Node;
    previousNode: Node;
    trajectory: Node[];

    update(): void;
    append(nodes: Node[]): void;
    set(nodes: Node[]): void;
}
