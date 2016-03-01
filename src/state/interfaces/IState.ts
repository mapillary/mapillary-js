import {Node} from "../../Graph";
import {Camera, Transform} from "../../Geo";
import {IRotation} from "../../State";

export interface IState {
    alpha: number;
    camera: Camera;

    trajectory: Node[];
    currentIndex: number;
    currentNode: Node;
    previousNode: Node;
    currentTransform: Transform;
    previousTransform: Transform;

    update(): void;
    append(nodes: Node[]): void;
    remove(n: number): void;
    cut(): void;
    set(nodes: Node[]): void;

    rotate(delta: IRotation): void;
}
