import {NewNode} from "../../Graph";
import {Camera, ILatLonAlt} from "../../Geo";

export interface IState {
    reference: ILatLonAlt;
    alpha: number;
    camera: Camera;
    zoom: number;
    trajectory: NewNode[];
    currentIndex: number;
}
