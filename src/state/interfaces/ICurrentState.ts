import {Camera, ILatLonAlt, Transform} from "../../Geo";
import {Node} from "../../Graph";
import {State} from "../../State";

export interface ICurrentState {
    reference: ILatLonAlt;
    alpha: number;
    camera: Camera;
    zoom: number;
    currentNode: Node;
    currentCamera: Camera;
    previousNode: Node;
    trajectory: Node[];
    currentIndex: number;
    lastNode: Node;
    nodesAhead: number;
    currentTransform: Transform;
    previousTransform: Transform;
    motionless: boolean;
    state: State;
}
