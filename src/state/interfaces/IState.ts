import {Node} from "../../Graph";
import {Camera, ILatLonAlt} from "../../Geo";

export interface IState {
    reference: ILatLonAlt;
    alpha: number;
    camera: Camera;
    trajectory: Node[];
    currentIndex: number;
}
