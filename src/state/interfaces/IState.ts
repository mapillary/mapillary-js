import {Node} from "../../Graph";
import {Camera} from "../../Geo";

export interface IState {
    alpha: number;
    camera: Camera;
    trajectory: Node[];
    currentIndex: number;
}
