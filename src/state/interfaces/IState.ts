import { Camera } from "../../geo/Camera";
import { ILatLonAlt } from "../../geo/interfaces/ILatLonAlt";
import { TransitionMode } from "../TransitionMode";
import { Node } from "../../graph/Node";

export interface IState {
    alpha: number;
    camera: Camera;
    currentIndex: number;
    reference: ILatLonAlt;
    trajectory: Node[];
    transitionMode: TransitionMode;
    zoom: number;
}
