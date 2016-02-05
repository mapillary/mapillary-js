import {Node} from "../../Graph";
import {Camera, Transform} from "../../Geo";

export interface ICurrentState {
    alpha: number;
    camera: Camera;
    currentNode: Node;
    previousNode: Node;
    trajectory: Node[];
    currentIndex: number;
    lastNode: Node;
    nodesAhead: number;
    currentTransform: Transform;
    previousTransform: Transform;
}
