import { Camera } from "../../geo/Camera";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { TransitionMode } from "../TransitionMode";
import { Image } from "../../graph/Image";

export interface IStateBase {
    alpha: number;
    camera: Camera;
    currentIndex: number;
    reference: LngLatAlt;
    trajectory: Image[];
    transitionMode: TransitionMode;
    zoom: number;
}
