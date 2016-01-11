import {Node} from "../../Graph";
import {Transform} from "../../Geo";

export interface ICurrentState2 {
    alpha: number;
    currentNode: Node;
    previousNode: Node;
    trajectory: Node[];
    currentTransform: Transform;
    previousTransform: Transform;
}
