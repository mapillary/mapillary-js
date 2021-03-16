import { Camera } from "../../geo/Camera";
import { LatLonAltEnt } from "../../api/ents/LatLonAltEnt";
import { TransitionMode } from "../TransitionMode";
import { Node } from "../../graph/Node";

export interface IStateBase {
    alpha: number;
    camera: Camera;
    currentIndex: number;
    reference: LatLonAltEnt;
    trajectory: Node[];
    transitionMode: TransitionMode;
    zoom: number;
}
