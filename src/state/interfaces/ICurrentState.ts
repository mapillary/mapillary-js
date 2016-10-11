import {NewNode} from "../../Graph";
import {Camera, ILatLonAlt, Transform} from "../../Geo";

export interface ICurrentState {
    reference: ILatLonAlt;
    alpha: number;
    camera: Camera;
    zoom: number;
    currentNode: NewNode;
    currentCamera: Camera;
    previousNode: NewNode;
    trajectory: NewNode[];
    currentIndex: number;
    lastNode: NewNode;
    nodesAhead: number;
    currentTransform: Transform;
    previousTransform: Transform;
    motionless: boolean;
}
