import {Node} from "../../Graph";
import {Camera, ILatLonAlt} from "../../Geo";

export interface IState {
    reference: ILatLonAlt;
    alpha: number;
    camera: Camera;
    zoom: number;
    trajectory: Node[];
    currentIndex: number;
}
