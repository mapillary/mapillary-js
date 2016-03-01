import {Node} from "../../Graph";
import {Camera, Transform} from "../../Geo";

export interface IState {
    alpha: number;
    camera: Camera;

    trajectory: Node[];
    currentIndex: number;
    currentNode: Node;
    previousNode: Node;
    currentTransform: Transform;
    previousTransform: Transform;
}
