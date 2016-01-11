import {Node} from "../../Graph";
import {Transform} from "../../Geo";

export interface IState {
    alpha: number;
    currentNode: Node;
    previousNode: Node;
    trajectory: Node[];
    currentTransform: Transform;
    previousTransform: Transform;

    update(): void;
    append(nodes: Node[]): void;
    set(nodes: Node[]): void;
}
