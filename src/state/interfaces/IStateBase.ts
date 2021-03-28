import { Camera } from "../../geo/Camera";
import { LatLonAlt } from "../../api/interfaces/LatLonAlt";
import { TransitionMode } from "../TransitionMode";
import { Image } from "../../graph/Image";

export interface IStateBase {
    alpha: number;
    camera: Camera;
    currentIndex: number;
    reference: LatLonAlt;
    trajectory: Image[];
    transitionMode: TransitionMode;
    zoom: number;
}
