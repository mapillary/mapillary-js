import {Node} from "../../Graph";
import {Camera, Transform} from "../../Geo";

export interface IState {
    alpha: number;
    camera: Camera;
    currentNode: Node;
    previousNode: Node;
    trajectory: Node[];
    currentTransform: Transform;
    previousTransform: Transform;

    update(): void;
    append(nodes: Node[]): void;
    remove(n: number): void;
    cut(): void;
    set(nodes: Node[]): void;
}
