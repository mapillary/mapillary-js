import { Camera } from "../../geo/Camera";
import { LatLonAlt } from "../../api/interfaces/LatLonAlt";
import { TransitionMode } from "../TransitionMode";
import { Node } from "../../graph/Node";

export interface IStateBase {
    alpha: number;
    camera: Camera;
    currentIndex: number;
    reference: LatLonAlt;
    trajectory: Node[];
    transitionMode: TransitionMode;
    zoom: number;
}
