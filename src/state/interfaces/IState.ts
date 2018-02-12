import {Node} from "../../Graph";
import {
    Camera,
    ILatLonAlt,
} from "../../Geo";
import {TransitionMode} from "../../State";

export interface IState {
    alpha: number;
    camera: Camera;
    currentIndex: number;
    reference: ILatLonAlt;
    trajectory: Node[];
    transitionMode: TransitionMode;
    zoom: number;
}
